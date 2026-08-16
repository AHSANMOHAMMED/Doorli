import { accountHandlers } from '@/lib/auth/account-auth'

// Keep the route boundary on the platform Request type. next-auth may resolve
// a different Next.js minor version in the monorepo, but the runtime contract
// is still the standard Request/Response pair.
const get = accountHandlers.GET as unknown as (request: Request) => Promise<Response>
const post = accountHandlers.POST as unknown as (request: Request) => Promise<Response>

export const GET = (request: Request) => get(request)
export const POST = (request: Request) => post(request)
