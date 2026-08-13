import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@doorli/db';
import { authenticateToken } from '../../middleware/authenticateToken.js';
import { AppError } from '../../middleware/errorHandler.js';

const assistantRouter = Router();
assistantRouter.use(authenticateToken);

type PlanAction = { module: 'ride' | 'bills' | 'grocery' | 'service'; description: string; params: Record<string, unknown> };

function parsePlan(message: string): { clarification?: string; actions: PlanAction[] } {
  const text = message.toLowerCase();
  const actions: PlanAction[] = [];
  if (text.includes('ride') || text.includes('taxi') || text.includes('car')) actions.push({ module: 'ride', description: 'Request a local ride', params: {} });
  if (text.includes('bill') || text.includes('recharge') || text.includes('electricity')) actions.push({ module: 'bills', description: 'Open bills and recharge payment', params: {} });
  if (text.includes('grocery') || text.includes('groceries') || text.includes('milk')) actions.push({ module: 'grocery', description: 'Find nearby grocery vendors', params: {} });
  if (text.includes('plumber') || text.includes('electrician') || text.includes('cleaner') || text.includes('service')) actions.push({ module: 'service', description: 'Create a home service request', params: {} });
  return actions.length ? { actions } : { clarification: 'What would you like help with: a ride, bills, groceries, or a home service?', actions: [] };
}

assistantRouter.post('/parse', async (req, res, next) => {
  try {
    const { message } = z.object({ message: z.string().min(2).max(1000) }).parse(req.body);
    const plan = parsePlan(message);
    const session = await prisma.aISession.create({ data: { userId: req.user!.id, message, actionPlan: JSON.parse(JSON.stringify(plan)), status: plan.clarification ? 'needs_clarification' : 'planned' } });
    if (plan.actions.length) await prisma.aIActionLog.createMany({ data: plan.actions.map((action) => ({ sessionId: session.id, module: action.module, params: JSON.parse(JSON.stringify(action.params)) })) });
    res.json({ success: true, data: { sessionId: session.id, ...plan } });
  } catch (err) { next(err); }
});

assistantRouter.post('/execute', async (req, res, next) => {
  try {
    const { sessionId, confirm } = z.object({ sessionId: z.string().uuid(), confirm: z.literal(true) }).parse(req.body);
    const session = await prisma.aISession.findUnique({ where: { id: sessionId }, include: { actions: true } });
    if (!session || session.userId !== req.user!.id) throw new AppError(404, 'Assistant session not found');
    if (session.status === 'completed') return res.json({ success: true, data: { sessionId, results: session.actions.map((action) => ({ module: action.module, status: action.status, result: action.result })) } });
    const results = session.actions.map((action) => ({ actionId: action.id, module: action.module, status: 'ready', message: `Open ${action.module} to confirm the details before payment or booking.` }));
    await prisma.$transaction([prisma.aISession.update({ where: { id: session.id }, data: { status: 'completed' } }), ...session.actions.map((action) => prisma.aIActionLog.update({ where: { id: action.id }, data: { status: 'ready', result: { message: `Action confirmed for ${action.module}` } } }))]);
    res.json({ success: true, data: { sessionId, confirmed: confirm, results } });
  } catch (err) { next(err); }
});

export default assistantRouter;
