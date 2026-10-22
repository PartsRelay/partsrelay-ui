import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const ROUTE = '/__local-review/session'
const UI_ORIGIN = 'http://localhost:5173'
const API_ORIGIN = 'http://localhost:3335'
const OWNER_EMAIL = 'local-owner@partsrelay.test'
const BODY_LIMIT = 256
const COOKIE_OCTETS = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/

type ReviewCookie = { name: string; value: string; expires: number }
type OwnerFixture = { userId: number; cookie: ReviewCookie }
type Dependencies = {
  readFixture: () => Promise<string>
  fetchSession: (url: string, options: RequestInit) => Promise<Response>
  now: () => number
}
type Next = () => void

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function ownerFixture(source: string, now: number, requireUnexpired: boolean): OwnerFixture | null {
  if (source.length > 65_536) return null
  const fixture = record(JSON.parse(source))
  if (
    fixture?.apiUrl !== API_ORIGIN ||
    fixture.uiOrigin !== UI_ORIGIN ||
    !Array.isArray(fixture.fixtures)
  )
    return null
  const owners = fixture.fixtures.map(record).filter((entry) => entry?.role === 'owner')
  if (owners.length !== 1) return null
  const owner = owners[0]
  const cookie = record(owner?.cookie)
  if (
    owner?.email !== OWNER_EMAIL ||
    typeof owner.userId !== 'number' ||
    !Number.isSafeInteger(owner.userId) ||
    owner.userId <= 0 ||
    !cookie ||
    cookie.domain !== 'localhost' ||
    cookie.path !== '/' ||
    cookie.httpOnly !== true ||
    cookie.secure !== false ||
    cookie.sameSite !== 'Lax' ||
    typeof cookie.name !== 'string' ||
    !/^[A-Za-z0-9_.-]{1,128}$/.test(cookie.name) ||
    cookie.name.startsWith('__Secure-') ||
    cookie.name.startsWith('__Host-') ||
    typeof cookie.value !== 'string' ||
    cookie.value.length > 4096 ||
    !COOKIE_OCTETS.test(cookie.value) ||
    !COOKIE_OCTETS.test(decodeURIComponent(cookie.value)) ||
    typeof cookie.expires !== 'number' ||
    !Number.isFinite(cookie.expires) ||
    (requireUnexpired && Math.floor(cookie.expires - now / 1000) <= 0)
  )
    return null
  return {
    userId: owner.userId,
    cookie: { name: cookie.name, value: cookie.value, expires: cookie.expires },
  }
}

function isLoopback(address: string | undefined) {
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function trustedRequest(request: IncomingMessage) {
  return (
    isLoopback(request.socket.remoteAddress) &&
    request.headers.host === 'localhost:5173' &&
    request.headers.origin === UI_ORIGIN &&
    request.headers['x-partsrelay-local-review'] === 'true' &&
    (request.headers['sec-fetch-site'] === undefined ||
      request.headers['sec-fetch-site'] === 'same-origin') &&
    request.headers['content-type']?.split(';')[0].trim().toLowerCase() === 'application/json'
  )
}

function reply(response: ServerResponse, status: number, code?: string) {
  response.statusCode = status
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  if (code) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify({ code }))
  } else response.end()
}

async function emptyBody(request: IncomingMessage) {
  if (request.headers['content-encoding'] && request.headers['content-encoding'] !== 'identity')
    return false
  const declared = request.headers['content-length']
  if (declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) > BODY_LIMIT))
    return false
  let body = ''
  let size = 0
  for await (const chunk of request) {
    const text = typeof chunk === 'string' ? chunk : (chunk as Buffer).toString('utf8')
    size += Buffer.byteLength(text)
    if (size > BODY_LIMIT) return false
    body += text
  }
  if (!body.trim()) return true
  try {
    const value = record(JSON.parse(body))
    return value !== null && Object.keys(value).length === 0
  } catch {
    return false
  }
}

function hasExactCookie(request: IncomingMessage, cookie: ReviewCookie) {
  const matches = (request.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.slice(0, part.indexOf('=')) === cookie.name)
  return matches.length === 1 && matches[0] === `${cookie.name}=${cookie.value}`
}

async function isValidSession(owner: OwnerFixture, dependencies: Dependencies) {
  const response = await dependencies.fetchSession(
    `${API_ORIGIN}/api/auth/get-session?disableCookieCache=true`,
    {
      method: 'GET',
      headers: {
        Cookie: `${owner.cookie.name}=${owner.cookie.value}`,
        Origin: UI_ORIGIN,
        Accept: 'application/json',
      },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    }
  )
  if (!response.ok) return false
  const body = record(await response.json())
  const user = record(body?.user)
  const session = record(body?.session)
  return (
    user?.email === OWNER_EMAIL &&
    String(user?.id) === String(owner.userId) &&
    session !== null &&
    String(session.userId) === String(owner.userId) &&
    typeof session.expiresAt === 'string' &&
    Date.parse(session.expiresAt) > dependencies.now()
  )
}

export function createLocalReviewHandler(dependencies: Dependencies) {
  return async (request: IncomingMessage, response: ServerResponse, next: Next) => {
    if (request.url !== ROUTE) {
      next()
      return
    }
    if (request.method !== 'POST' && request.method !== 'DELETE') {
      response.setHeader('Allow', 'POST, DELETE')
      reply(response, 405, 'METHOD_NOT_ALLOWED')
      return
    }
    if (!trustedRequest(request)) {
      reply(response, 403, 'LOCAL_REVIEW_FORBIDDEN')
      return
    }
    try {
      if (!(await emptyBody(request))) {
        reply(response, 400, 'INVALID_REQUEST')
        return
      }
      const owner = ownerFixture(
        await dependencies.readFixture(),
        dependencies.now(),
        request.method === 'POST'
      )
      if (!owner) {
        reply(response, 503, 'LOCAL_REVIEW_UNAVAILABLE')
        return
      }
      if (request.method === 'DELETE') {
        if (!hasExactCookie(request, owner.cookie)) {
          reply(response, 409, 'LOCAL_REVIEW_NOT_ACTIVE')
          return
        }
        // Local review only: clear this exact browser cookie but retain its seeded
        // server session so sign-in can be repeated. Other accounts must use the
        // ordinary backend sign-out, which revokes their session.
        response.setHeader(
          'Set-Cookie',
          `${owner.cookie.name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
        )
        reply(response, 204)
        return
      }
      if (!(await isValidSession(owner, dependencies))) {
        reply(response, 503, 'LOCAL_REVIEW_UNAVAILABLE')
        return
      }
      const maxAge = Math.min(3600, Math.floor(owner.cookie.expires - dependencies.now() / 1000))
      if (maxAge <= 0) {
        reply(response, 503, 'LOCAL_REVIEW_UNAVAILABLE')
        return
      }
      response.setHeader(
        'Set-Cookie',
        `${owner.cookie.name}=${owner.cookie.value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
      )
      reply(response, 204)
    } catch {
      // Never expose fixture content, filesystem paths, cookies or backend responses.
      reply(response, 503, 'LOCAL_REVIEW_UNAVAILABLE')
    }
  }
}

export function localReviewAuth(enabled: boolean): Plugin {
  return {
    name: 'partsrelay-local-review-auth',
    apply: 'serve',
    configureServer(server) {
      if (!enabled) return
      if (
        server.config.command !== 'serve' ||
        server.config.mode !== 'development' ||
        server.config.isProduction
      ) {
        throw new Error('Local review authentication requires the development server')
      }
      const fixturePath = resolve(
        server.config.root,
        '../partsrelay-core/tmp/local-review-sessions.json'
      )
      server.middlewares.use(
        createLocalReviewHandler({
          readFixture: () => readFile(fixturePath, 'utf8'),
          fetchSession: (url, options) => fetch(url, options),
          now: Date.now,
        })
      )
    },
  }
}
