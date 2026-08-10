import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@doorli/db';

const prisma = new PrismaClient();

type AIProvider = 'openai' | 'anthropic' | 'gemini';

const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

function getProviderOrder(): AIProvider[] {
  const raw = process.env.AI_PROVIDER_ORDER || process.env.AI_PROVIDER;
  if (raw) {
    const parsed = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item): item is AIProvider => item === 'openai' || item === 'anthropic' || item === 'gemini');
    if (parsed.length) return [...new Set(parsed)];
  }

  return ['openai', 'anthropic', 'gemini'];
}

async function generateAiText(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number; temperature?: number } = {},
): Promise<{ text: string; model: string } | null> {
  for (const provider of getProviderOrder()) {
    try {
      if (provider === 'openai' && process.env.OPENAI_API_KEY) {
        return await callOpenAI(prompt, options);
      }

      if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
        return await callAnthropic(prompt, options);
      }

      if (provider === 'gemini' && geminiClient) {
        return await callGemini(prompt, options);
      }
    } catch (error) {
      console.warn(`[AI Service] ${provider} failed`, error);
    }
  }

  return null;
}

async function callOpenAI(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number; temperature?: number } = {},
): Promise<{ text: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options.maxTokens || 512,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error ${response.status}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return { text: data.choices?.[0]?.message?.content || '', model: process.env.OPENAI_MODEL || 'gpt-4o-mini' };
}

async function callAnthropic(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number; temperature?: number } = {},
): Promise<{ text: string; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      system: options.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 512,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}`);
  }

  const data = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  return {
    text: data.content?.map((part) => (part.type === 'text' ? part.text : '')).join('') || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  };
}

async function callGemini(
  prompt: string,
  options: { systemPrompt?: string; maxTokens?: number; temperature?: number } = {},
): Promise<{ text: string; model: string }> {
  if (!geminiClient) throw new Error('GEMINI_API_KEY not configured');

  const model = geminiClient.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      maxOutputTokens: options.maxTokens || 512,
      temperature: options.temperature ?? 0.7,
    },
    ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
  });

  const result = await model.generateContent(prompt);
  return { text: result.response.text(), model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' };
}

function fallbackRecommendations(productNames: string[]): string[] {
  const joined = productNames.join(' ').toLowerCase();
  const categories = [
    joined.includes('rice') || joined.includes('grocery') ? 'Groceries' : null,
    joined.includes('food') || joined.includes('meal') ? 'Food delivery' : null,
    joined.includes('clean') || joined.includes('repair') ? 'Home services' : null,
    joined.includes('medicine') ? 'Pharmacy items' : null,
  ].filter(Boolean) as string[];

  if (categories.length) return categories.slice(0, 3);
  return ['Groceries', 'Food delivery', 'Home services'];
}

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const pastOrders = await prisma.order.findMany({
      where: { customerId: userId },
      take: 5,
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    const productNames = pastOrders.flatMap((order) => order.items.map((item) => item.product.name));

    const prompt =
      productNames.length > 0
        ? `A user recently bought these items: ${productNames.join(', ')}. What are 3 other generic product categories they might like? Return only a comma separated list.`
        : 'Suggest 3 generic product categories for a new user exploring a local marketplace. Return only a comma separated list.';

    const aiResult = await generateAiText(prompt, { maxTokens: 128, temperature: 0.4 });
    const responseText = aiResult?.text || fallbackRecommendations(productNames).join(', ');

    const recommendations = responseText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    res.json({ recommendations, model: aiResult?.model || 'fallback' });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: error.message });
  }
};

export const analyzeReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewText } = req.body;
    if (!reviewText) {
      res.status(400).json({ error: 'reviewText is required' });
      return;
    }

    const prompt = `Analyze the sentiment of the following review. Return a JSON object with two fields: "sentiment" (either "positive", "negative", or "neutral") and "score" (a number between 0 and 1). Review: "${reviewText}"`;

    const aiResult = await generateAiText(prompt, { maxTokens: 128, temperature: 0.1 });
    let text = aiResult?.text.trim() || '';
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    }

    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      res.json({ sentiment: 'neutral', score: 0.5, raw: text, model: aiResult?.model || 'fallback' });
    }
  } catch (error: any) {
    console.error('Error analyzing review:', error);
    res.status(500).json({ error: error.message });
  }
};
