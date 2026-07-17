import { prisma } from '@doorli/db';

export type AiReply = {
  reply: string;
  intent: string;
  confidence: number;
  vendors?: Array<{ id: string; businessName: string; category: string }>;
};

/**
 * Recommendation + intent assistant.
 * Uses order history and vendor search; optional LLM via OPENAI_API_KEY / DEEPSEEK_API_KEY.
 */
export class DoorliAiAssistant {
  static async processUserQuery(prompt: string, context: { userId?: string } = {}): Promise<AiReply> {
    const q = prompt.toLowerCase();

    let intent = 'GENERAL';
    if (/ride|taxi|uber|pick.?up/.test(q)) intent = 'BOOK_RIDE';
    else if (/book|hotel|hall|salon|beauty|appointment/.test(q)) intent = 'BOOK_SERVICE';
    else if (/order|food|grocery|hungry|deliver/.test(q)) intent = 'ORDER_FOOD';
    else if (/plumb|electric|repair|clean|ac /.test(q)) intent = 'HOME_SERVICE';
    else if (/search|find|near|where/.test(q)) intent = 'SEARCH_BUSINESS';

    const keywords = prompt
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const vendors = await prisma.vendor.findMany({
      where: {
        isOpen: true,
        ...(keywords.length
          ? {
              OR: keywords.flatMap((k) => {
                const cat = mapCategory(k);
                return [
                  { businessName: { contains: k, mode: 'insensitive' as const } },
                  { description: { contains: k, mode: 'insensitive' as const } },
                  ...(cat ? [{ category: cat as never }] : []),
                ];
              }),
            }
          : {}),
      },
      take: 5,
      orderBy: { avgRating: 'desc' },
      select: { id: true, businessName: true, category: true },
    });

    // Personalized boost from history
    if (context.userId && !vendors.length) {
      const past = await prisma.order.findMany({
        where: { customerId: context.userId },
        select: { vendorId: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      const ids = [...new Set(past.map((p) => p.vendorId))];
      if (ids.length) {
        const hist = await prisma.vendor.findMany({
          where: { id: { in: ids }, isOpen: true },
          take: 5,
          select: { id: true, businessName: true, category: true },
        });
        vendors.push(...hist);
      }
    }

    const llmReply = await tryLlmReply(prompt, vendors);
    const reply =
      llmReply ||
      (vendors.length
        ? `I found ${vendors.length} local options for you: ${vendors.map((v) => v.businessName).join(', ')}.`
        : 'I can help you order food, book hotels or halls, hire home pros, or find a ride. What do you need?');

    return {
      reply,
      intent,
      confidence: vendors.length ? 0.9 : 0.7,
      vendors,
    };
  }
}

function mapCategory(word: string): string | undefined {
  const map: Record<string, string> = {
    grocery: 'grocery',
    food: 'restaurant',
    restaurant: 'restaurant',
    hotel: 'hotel',
    hall: 'hall',
    wedding: 'hall',
    beauty: 'beauty',
    salon: 'beauty',
    plumber: 'service',
    electric: 'service',
  };
  return map[word.toLowerCase()];
}

async function tryLlmReply(
  prompt: string,
  vendors: Array<{ businessName: string }>,
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
  const base = process.env.DEEPSEEK_API_KEY
    ? 'https://api.deepseek.com/v1/chat/completions'
    : process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1/chat/completions'
      : null;
  if (!key || !base) return null;

  try {
    const res = await fetch(base, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_API_KEY ? 'deepseek-chat' : 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are Doorli, a local community super-app assistant in Sri Lanka. Be concise. Suggest local businesses when relevant.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nKnown matches: ${vendors.map((v) => v.businessName).join(', ') || 'none'}`,
          },
        ],
        max_tokens: 200,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}
