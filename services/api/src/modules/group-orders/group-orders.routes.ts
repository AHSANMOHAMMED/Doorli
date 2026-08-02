import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../../middleware/authenticateToken'

const router = Router()
const prisma = new PrismaClient()

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, vendorId } = req.body
    const userId = (req as any).user!.id
    const groupOrder = await prisma.groupOrder.create({
      data: { createdBy: userId, vendorId, title, inviteCode: generateInviteCode() },
      include: { vendor: { select: { businessName: true } } }
    })
    res.status(201).json(groupOrder)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create group order' })
  }
})

router.get('/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await prisma.groupOrder.findMany({
      where: { createdBy: (req as any).user!.id },
      include: { vendor: { select: { businessName: true, logoUrl: true } }, items: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group orders' })
  }
})

router.get('/join/:inviteCode', authenticateToken, async (req: Request, res: Response) => {
  try {
    const code = String(req.params.inviteCode)
    const groupOrder = await prisma.groupOrder.findUnique({
      where: { inviteCode: code },
      include: { vendor: { select: { businessName: true, logoUrl: true } }, items: { include: { user: { select: { fullName: true } }, product: true } } }
    })
    if (!groupOrder) return res.status(404).json({ error: 'Group order not found' })
    if (groupOrder.status !== 'open') return res.status(400).json({ error: 'Group order is no longer accepting items' })
    res.json(groupOrder)
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group order' })
  }
})

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const groupOrder = await prisma.groupOrder.findUnique({
      where: { id },
      include: {
        vendor: { select: { businessName: true, logoUrl: true } },
        items: { include: { user: { select: { id: true, fullName: true } }, product: true } }
      }
    })
    if (!groupOrder) return res.status(404).json({ error: 'Group order not found' })
    const participants = [...new Set(groupOrder.items.map((i: any) => JSON.stringify({ id: i.userId, name: i.user.fullName })))].map((p: string) => JSON.parse(p))
    const subtotal = groupOrder.items.reduce((sum: number, item: any) => sum + (Number(item.product.price) * item.quantity), 0)
    res.json({ ...groupOrder, participants, subtotal })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group order' })
  }
})

router.post('/:id/items', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { productId, quantity, notes } = req.body
    const groupOrder = await prisma.groupOrder.findUnique({ where: { id } })
    if (!groupOrder) return res.status(404).json({ error: 'Group order not found' })
    if (groupOrder.status !== 'open') return res.status(400).json({ error: 'Group order is no longer accepting items' })
    const item = await prisma.groupOrderItem.create({
      data: { groupOrderId: id, userId: (req as any).user!.id, productId, quantity: quantity || 1, notes },
      include: { product: true, user: { select: { fullName: true } } }
    })
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' })
  }
})

router.delete('/:id/items/:itemId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const itemId = String(req.params.itemId)
    const item = await prisma.groupOrderItem.findUnique({ where: { id: itemId } })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    if (item.userId !== (req as any).user!.id) return res.status(403).json({ error: 'Can only remove your own items' })
    await prisma.groupOrderItem.delete({ where: { id: itemId } })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' })
  }
})

router.post('/:id/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const groupOrder = await prisma.groupOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    })
    if (!groupOrder) return res.status(404).json({ error: 'Group order not found' })
    if (groupOrder.createdBy !== (req as any).user!.id) return res.status(403).json({ error: 'Only the creator can submit' })
    if (groupOrder.items.length === 0) return res.status(400).json({ error: 'No items in group order' })
    await prisma.groupOrder.update({ where: { id }, data: { status: 'submitted' } })
    res.json({ success: true, message: 'Group order submitted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit group order' })
  }
})

export default router
