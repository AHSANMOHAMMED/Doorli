import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@doorli/db';

const prisma = new PrismaClient();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('[AI Service] FATAL: GEMINI_API_KEY is not set. AI service cannot start.');
}
const genAI = new GoogleGenerativeAI(apiKey);

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Fetch user context from the database for personalization
    const pastOrders = await prisma.order.findMany({
      where: { customerId: userId },
      take: 5,
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    const productNames = pastOrders.flatMap(order => order.items.map(i => i.product.name));

    // Fallback if no past orders
    const prompt = productNames.length > 0 
      ? `A user recently bought these items: ${productNames.join(', ')}. What are 3 other generic product categories they might like? Return only a comma separated list.`
      : `Suggest 3 generic product categories for a new user exploring a local marketplace. Return only a comma separated list.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const recommendations = responseText.split(',').map(item => item.trim());

    res.json({ recommendations });
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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze the sentiment of the following review. Return a JSON object with two fields: "sentiment" (either "positive", "negative", or "neutral") and "score" (a number between 0 and 1). Review: "${reviewText}"`;
    
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```json')) {
      text = text.substring(7, text.length - 3).trim();
    }
    
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (parseError) {
      res.json({ sentiment: 'neutral', score: 0.5, raw: text });
    }
  } catch (error: any) {
    console.error('Error analyzing review:', error);
    res.status(500).json({ error: error.message });
  }
};
