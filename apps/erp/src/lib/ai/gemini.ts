import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai'

type AIProvider = 'openai' | 'anthropic' | 'deepseek' | 'gemini'

let genAI: GoogleGenerativeAI | null = null

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export function isAIEnabled(): boolean {
  return !!(
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.GEMINI_API_KEY
  )
}

export function isAIEnabledForTenant(session: { user: { aiEnabled?: boolean } } | null): boolean {
  if (!isAIEnabled()) return false
  return session?.user?.aiEnabled === true
}

export function getActiveProvider(): AIProvider | null {
  for (const provider of getProviderOrder()) {
    if (!isProviderConfigured(provider)) continue
    if (provider === 'deepseek' && isOnCooldown('deepseek-chat')) continue
    if (provider === 'gemini' && getAvailableGeminiModels().length === 0) continue
    return provider
  }
  return null
}

function getProviderOrder(): AIProvider[] {
  const raw = process.env.AI_PROVIDER_ORDER || process.env.AI_PROVIDER
  if (raw) {
    const parsed = raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value): value is AIProvider => value === 'openai' || value === 'anthropic' || value === 'deepseek' || value === 'gemini')
    if (parsed.length) return [...new Set(parsed)]
  }

  return ['openai', 'anthropic', 'deepseek', 'gemini']
}

function isProviderConfigured(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY
    case 'gemini':
      return !!process.env.GEMINI_API_KEY
  }
}

const GEMINI_MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-3-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

const failedModels = new Map<string, number>()
const MODEL_COOLDOWN_MS = 5 * 60 * 1000

function isOnCooldown(model: string): boolean {
  const failedAt = failedModels.get(model)
  return !!failedAt && Date.now() - failedAt < MODEL_COOLDOWN_MS
}

function isModelAvailable(model: string): boolean {
  const failedAt = failedModels.get(model)
  if (!failedAt) return true
  if (Date.now() - failedAt > MODEL_COOLDOWN_MS) {
    failedModels.delete(model)
    return true
  }
  return false
}

function getAvailableGeminiModels(): string[] {
  return GEMINI_MODEL_CHAIN.filter((model) => isModelAvailable(model))
}

const rateLimiter = {
  requests: [] as number[],
  maxPerMinute: 10,
  maxPerDay: 200,

  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter((t) => t > now - 86400000)
    if (this.requests.length >= this.maxPerDay) return false
    const lastMinute = this.requests.filter((t) => t > now - 60000)
    if (lastMinute.length >= this.maxPerMinute) return false
    return true
  },

  recordRequest(): void {
    this.requests.push(Date.now())
  },
}

const tokenTracker = {
  daily: { input: 0, output: 0, date: '' },

  record(inputTokens: number, outputTokens: number): void {
    const today = new Date().toISOString().slice(0, 10)
    if (this.daily.date !== today) {
      this.daily = { input: 0, output: 0, date: today }
    }
    this.daily.input += inputTokens
    this.daily.output += outputTokens
  },

  getUsage() {
    return { ...this.daily }
  },
}

export interface AIResponse {
  text: string
  model?: string
  inputTokens?: number
  outputTokens?: number
}

let lastError: string | null = null
let currentModel: string | null = null
export function getLastError(): string | null {
  return lastError
}
export function getCurrentModel(): string | null {
  return currentModel
}

async function callDeepSeek(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<AIResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured')

  const messages: Array<{ role: string; content: string }> = []
  if (options?.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`DeepSeek API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  return {
    text: data.choices?.[0]?.message?.content || '',
    model: 'deepseek-chat',
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  }
}

async function callOpenAI(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const messages: Array<{ role: string; content: string }> = []
  if (options?.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  return {
    text: data.choices?.[0]?.message?.content || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  }
}

async function callAnthropic(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      system: options?.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  const text = data.content?.map((part: { type?: string; text?: string }) => (part.type === 'text' ? part.text : '')).join('') || ''
  return {
    text,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  }
}

async function callGemini(
  client: GoogleGenerativeAI,
  modelName: string,
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<AIResponse> {
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: options?.maxTokens || 1024,
      temperature: options?.temperature ?? 0.7,
    },
    ...(options?.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
  })

  const result: GenerateContentResult = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  return {
    text,
    model: modelName,
    inputTokens: response.usageMetadata?.promptTokenCount || 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
  }
}

export async function generateText(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<AIResponse | null> {
  if (!isAIEnabled()) return null

  if (!rateLimiter.canMakeRequest()) {
    console.warn('[AI] Rate limit reached, skipping request')
    lastError = 'Rate limit reached. Please wait a moment before trying again.'
    return null
  }

  rateLimiter.recordRequest()

  for (const provider of getProviderOrder()) {
    if (!isProviderConfigured(provider)) continue

    try {
      if (provider === 'openai') {
        const result = await callOpenAI(prompt, options)
        tokenTracker.record(result.inputTokens || 0, result.outputTokens || 0)
        currentModel = result.model || 'gpt-4o-mini'
        lastError = null
        console.log(`[AI] Success with ${currentModel}`)
        return result
      }

      if (provider === 'anthropic') {
        const result = await callAnthropic(prompt, options)
        tokenTracker.record(result.inputTokens || 0, result.outputTokens || 0)
        currentModel = result.model || 'claude-sonnet-4-6'
        lastError = null
        console.log(`[AI] Success with ${currentModel}`)
        return result
      }

      if (provider === 'deepseek') {
        if (isOnCooldown('deepseek-chat')) continue
        const result = await callDeepSeek(prompt, options)
        tokenTracker.record(result.inputTokens || 0, result.outputTokens || 0)
        currentModel = 'deepseek-chat'
        lastError = null
        console.log('[AI] Success with deepseek-chat')
        return result
      }

      if (provider === 'gemini') {
        const geminiClient = getGeminiClient()
        if (!geminiClient) continue
        const models = getAvailableGeminiModels()
        for (const modelName of models) {
          const result = await callGemini(geminiClient, modelName, prompt, options)
          tokenTracker.record(result.inputTokens || 0, result.outputTokens || 0)
          currentModel = modelName
          lastError = null
          console.log(`[AI] Success with ${modelName}`)
          return result
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      lastError = msg
      if (provider === 'deepseek') {
        failedModels.set('deepseek-chat', Date.now())
      }
      console.error(`[AI] ${provider} error: ${msg.slice(0, 120)}`)
    }
  }

  lastError = 'All AI providers failed (quota exceeded or unavailable)'
  console.error('[AI] All providers exhausted')
  return null
}

export async function generateJSON<T>(
  prompt: string,
  options?: {
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
  },
): Promise<T | null> {
  const response = await generateText(prompt, {
    ...options,
    systemPrompt: (options?.systemPrompt || '') + '\n\nRespond ONLY with valid JSON. No markdown, no code fences, no explanation.',
  })

  if (!response) return null

  try {
    let jsonText = response.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    return JSON.parse(jsonText) as T
  } catch {
    console.error('[AI] Failed to parse JSON response:', response.text.slice(0, 200))
    return null
  }
}

export function getTokenUsage() {
  return tokenTracker.getUsage()
}
