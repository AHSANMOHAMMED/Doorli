import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DoorliAiAssistant } from './agent.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.AI_PORT || 4006);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai' });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const prompt = String(req.body.prompt || req.body.message || '');
    if (!prompt) {
      res.status(400).json({ success: false, error: 'prompt required' });
      return;
    }
    const result = await DoorliAiAssistant.processUserQuery(prompt, {
      userId: req.body.userId,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'AI failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Doorli AI service on http://localhost:${PORT}`);
});
