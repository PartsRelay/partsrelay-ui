import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ViteDevServer } from 'vite'
import { describe, expect, it, vi } from 'vite-plus/test'
import { createLocalReviewHandler, localReviewAuth } from './local-review-auth'

const NOW = Date.parse('2026-10-21T12:00:00Z')
const COOKIE_NAME = 'better-auth.session_token'
const COOKIE_VALUE = 'test-session.test-signature%3D'
function fixture() {
  return {
    apiUrl: 'http://localhost:3335',
    uiOrigin: 'http://localhost:5173',
    fixtures: [
      {
        role: 'owner',
        email: 'local-owner@partsrelay.test',
        userId: 1,
        cookie: {
          name: COOKIE_NAME,
          value: COOKIE_VALUE,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
          expires: NOW / 1000 + 7200,
        },
      },
    ],
  }
}
function session() {
  return {
    user: { id: '1', email: 'local-owner@partsrelay.test' },
    session: { userId: '1', expiresAt: new Date(NOW + 7200_000).toISOString() },
  }
}
type RequestOptions = {
  method?: string
  url?: string
  body?: string
  remote?: string
  headers?: Record<string, string | undefined>
}
function harness(
  options: { fixture?: unknown; backend?: unknown; status?: number; failure?: Error } = {}
) {
  const readFixture = vi.fn(async () => JSON.stringify(options.fixture ?? fixture()))
  const fetchSession = vi.fn(async (_url: string, _options: RequestInit) => {
    if (options.failure) throw options.failure
    return new Response(JSON.stringify('backend' in options ? options.backend : session()), {
      status: options.status ?? 200,
    })
  })
  const handler = createLocalReviewHandler({ readFixture, fetchSession, now: () => NOW })
  const invoke = async (options: RequestOptions = {}) => {
    const request = Readable.from([Buffer.from(options.body ?? '{}')]) as IncomingMessage
    request.method = options.method ?? 'POST'
    request.url = options.url ?? '/__local-review/session'
    request.headers = {
      'host': 'localhost:5173',
      'origin': 'http://localhost:5173',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
      'x-partsrelay-local-review': 'true',
      ...options.headers,
    }
    Object.defineProperty(request, 'socket', {
      value: { remoteAddress: options.remote ?? '127.0.0.1' },
    })
    const headers = new Map<string, string>()
    let body = ''
    const response = {
      statusCode: 200,
      setHeader: (name: string, value: string) => headers.set(name.toLowerCase(), value),
      end: (value = '') => {
        body = value
      },
    } as unknown as ServerResponse
    const next = vi.fn()
    await handler(request, response, next)
    return { status: response.statusCode, headers, body, next }
  }
  return { invoke, readFixture, fetchSession }
}

describe('local review session boundary', () => {
  it('validates the fixed owner with the real API before issuing a host-only cookie', async () => {
    const test = harness()
    const result = await test.invoke()
    expect(result.status).toBe(204)
    expect(result.body).toBe('')
    expect(result.headers.get('cache-control')).toBe('no-store')
    expect(result.headers.get('set-cookie')).toBe(
      `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
    )
    expect(test.fetchSession).toHaveBeenCalledWith(
      'http://localhost:3335/api/auth/get-session?disableCookieCache=true',
      expect.objectContaining({
        method: 'GET',
        redirect: 'error',
        cache: 'no-store',
        signal: expect.any(AbortSignal),
        headers: expect.objectContaining({ Cookie: `${COOKIE_NAME}=${COOKIE_VALUE}` }),
      })
    )
  })

  it.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'accepts loopback address %s',
    async (remote) => {
      expect((await harness().invoke({ remote })).status).toBe(204)
    }
  )

  it.each([
    { host: 'evil.example:5173' },
    { host: '127.0.0.1:5173' },
    { origin: 'https://evil.example' },
    { origin: undefined },
    { origin: 'null' },
    { 'sec-fetch-site': 'cross-site' },
    { 'sec-fetch-site': 'same-site' },
    { 'content-type': 'text/plain' },
    { 'content-type': undefined },
    { 'x-partsrelay-local-review': undefined },
    { 'x-partsrelay-local-review': 'false' },
  ])('rejects untrusted headers before reading a fixture: %j', async (headers) => {
    const test = harness()
    const result = await test.invoke({ headers })
    expect(result.status).toBe(403)
    expect(result.headers.has('set-cookie')).toBe(false)
    expect(test.readFixture).not.toHaveBeenCalled()
    expect(test.fetchSession).not.toHaveBeenCalled()
  })

  it('rejects a non-loopback peer even with trusted-looking headers', async () => {
    const test = harness()
    expect((await test.invoke({ remote: '192.168.1.10' })).status).toBe(403)
    expect(test.readFixture).not.toHaveBeenCalled()
  })

  it('accepts absent fetch metadata only with the exact Origin and custom header', async () => {
    expect((await harness().invoke({ headers: { 'sec-fetch-site': undefined } })).status).toBe(204)
  })

  it.each(['GET', 'OPTIONS', 'PUT', 'PATCH'])(
    'rejects method %s without setting a cookie',
    async (method) => {
      const test = harness()
      const result = await test.invoke({ method })
      expect(result.status).toBe(405)
      expect(result.headers.get('allow')).toBe('POST, DELETE')
      expect(result.headers.has('set-cookie')).toBe(false)
      expect(test.readFixture).not.toHaveBeenCalled()
    }
  )

  it.each(['/__local-review/session?role=admin', '/__local-review/session/', '/other'])(
    'leaves other paths untouched: %s',
    async (url) => {
      const test = harness()
      const result = await test.invoke({ url })
      expect(result.next).toHaveBeenCalledOnce()
      expect(result.headers.size).toBe(0)
      expect(test.readFixture).not.toHaveBeenCalled()
    }
  )

  it.each(['', '{}', '  '])('accepts an empty request body %j', async (body) => {
    expect((await harness().invoke({ body })).status).toBe(204)
  })

  it.each([
    '{"role":"admin"}',
    '{"redirect":"https://evil.example"}',
    'null',
    '[]',
    'bad json',
    ' '.repeat(257),
  ])('rejects nonempty or oversized input', async (body) => {
    const test = harness()
    expect((await test.invoke({ body })).status).toBe(400)
    expect(test.readFixture).not.toHaveBeenCalled()
  })

  it('rejects oversized Content-Length before reading a fixture', async () => {
    const test = harness()
    expect((await test.invoke({ headers: { 'content-length': '999999' } })).status).toBe(400)
    expect(test.readFixture).not.toHaveBeenCalled()
  })

  it.each([
    ['expires', NOW / 1000],
    ['expires', 'tomorrow'],
    ['httpOnly', false],
    ['secure', true],
    ['sameSite', 'None'],
    ['path', '/other'],
    ['domain', 'example.com'],
    ['name', 'bad\r\nSet-Cookie: injected'],
    ['value', 'bad;other=value'],
    ['value', 'bad\r\ninjected'],
    ['value', 'bad%0D%0Ainjected'],
    ['value', 'bad%escape'],
  ])('rejects invalid fixture cookie field %s', async (key, value) => {
    const data = fixture()
    Object.assign(data.fixtures[0].cookie, { [String(key)]: value })
    const test = harness({ fixture: data })
    const result = await test.invoke()
    expect(result.status).toBe(503)
    expect(result.headers.has('set-cookie')).toBe(false)
    expect(result.body).toBe('{"code":"LOCAL_REVIEW_UNAVAILABLE"}')
    expect(test.fetchSession).not.toHaveBeenCalled()
  })

  it.each(['apiUrl', 'uiOrigin'])('rejects a fixture for a different runtime: %s', async (key) => {
    const data = fixture()
    Object.assign(data, { [key]: 'https://production.example' })
    const test = harness({ fixture: data })
    expect((await test.invoke()).status).toBe(503)
    expect(test.fetchSession).not.toHaveBeenCalled()
  })

  it('rejects another owner or ambiguous owner fixtures', async () => {
    const wrong = fixture()
    wrong.fixtures[0].email = 'another@example.com'
    expect((await harness({ fixture: wrong }).invoke()).status).toBe(503)
    const duplicate = fixture()
    duplicate.fixtures.push(duplicate.fixtures[0])
    expect((await harness({ fixture: duplicate }).invoke()).status).toBe(503)
  })

  it('caps the cookie to the remaining fixture lifetime', async () => {
    const data = fixture()
    data.fixtures[0].cookie.expires = NOW / 1000 + 90
    expect((await harness({ fixture: data }).invoke()).headers.get('set-cookie')).toContain(
      'Max-Age=90'
    )
  })

  it.each([
    null,
    {},
    { user: session().user, session: null },
    { ...session(), user: { id: '2', email: 'local-owner@partsrelay.test' } },
    { ...session(), user: { id: '1', email: 'another@example.com' } },
    { ...session(), session: { userId: '2', expiresAt: session().session.expiresAt } },
    { ...session(), session: { userId: '1', expiresAt: new Date(NOW - 1).toISOString() } },
  ])('rejects revoked, expired or mismatched backend sessions', async (backend) => {
    const result = await harness({ backend }).invoke()
    expect(result.status).toBe(503)
    expect(result.headers.has('set-cookie')).toBe(false)
    expect(result.body).toBe('{"code":"LOCAL_REVIEW_UNAVAILABLE"}')
  })

  it.each([401, 403, 500])('rejects backend status %s', async (status) => {
    expect((await harness({ status }).invoke()).status).toBe(503)
  })

  it('does not expose fixture or upstream failures', async () => {
    const error = new Error('private-token private-path')
    const test = harness({ failure: error })
    const result = await test.invoke()
    expect(result.status).toBe(503)
    expect(result.body).not.toContain('private')
    test.readFixture.mockRejectedValueOnce(error)
    expect((await test.invoke()).body).toBe('{"code":"LOCAL_REVIEW_UNAVAILABLE"}')
  })

  it('clears only the exact local owner cookie without revoking its reusable session', async () => {
    const test = harness()
    const result = await test.invoke({
      method: 'DELETE',
      headers: { cookie: `other=one; ${COOKIE_NAME}=${COOKIE_VALUE}` },
    })
    expect(result.status).toBe(204)
    expect(result.body).toBe('')
    expect(result.headers.get('set-cookie')).toBe(
      `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    )
    expect(test.fetchSession).not.toHaveBeenCalled()
    expect((await test.invoke()).status).toBe(204)
  })

  it('can clear an expired seeded cookie while still refusing a different real cookie', async () => {
    const data = fixture()
    data.fixtures[0].cookie.expires = NOW / 1000 - 60
    const test = harness({ fixture: data })
    const local = await test.invoke({
      method: 'DELETE',
      headers: { cookie: `${COOKIE_NAME}=${COOKIE_VALUE}` },
    })
    expect(local.status).toBe(204)
    expect(local.headers.get('set-cookie')).toContain('Max-Age=0')
    const other = await test.invoke({
      method: 'DELETE',
      headers: { cookie: `${COOKIE_NAME}=real-user-session` },
    })
    expect(other.status).toBe(409)
    expect(other.headers.has('set-cookie')).toBe(false)
    expect(test.fetchSession).not.toHaveBeenCalled()
    expect((await test.invoke()).status).toBe(503)
  })

  it.each([
    undefined,
    `${COOKIE_NAME}=real-user-session`,
    `${COOKIE_NAME}=${COOKIE_VALUE}; ${COOKIE_NAME}=${COOKIE_VALUE}`,
  ])('leaves another or ambiguous session for ordinary backend sign-out', async (cookie) => {
    const test = harness()
    const result = await test.invoke({ method: 'DELETE', headers: { cookie } })
    expect(result.status).toBe(409)
    expect(result.body).toBe('{"code":"LOCAL_REVIEW_NOT_ACTIVE"}')
    expect(result.headers.has('set-cookie')).toBe(false)
    expect(test.fetchSession).not.toHaveBeenCalled()
  })
})

describe('local review plugin registration', () => {
  function configure(
    enabled: boolean,
    mode = 'development',
    command = 'serve',
    isProduction = false
  ) {
    const plugin = localReviewAuth(enabled)
    const use = vi.fn()
    const server = {
      config: { root: 'C:/partsrelay-ui', mode, command, isProduction },
      middlewares: { use },
    } as unknown as ViteDevServer
    const hook = plugin.configureServer
    if (typeof hook !== 'function') throw new Error('Expected development hook')
    return { plugin, use, run: () => hook.call({} as never, server) }
  }

  it('registers only a development-server middleware when explicitly enabled', () => {
    const test = configure(true)
    expect(test.plugin.apply).toBe('serve')
    expect(test.plugin.configurePreviewServer).toBeUndefined()
    test.run()
    expect(test.use).toHaveBeenCalledOnce()
  })

  it('registers nothing when disabled', () => {
    const test = configure(false)
    test.run()
    expect(test.use).not.toHaveBeenCalled()
  })

  it.each([
    ['production', 'serve', true],
    ['staging', 'serve', false],
    ['development', 'build', false],
    ['development', 'serve', true],
  ] as const)('rejects non-development configuration %s/%s', (mode, command, production) => {
    const test = configure(true, mode, command, production)
    expect(test.run).toThrow('development server')
    expect(test.use).not.toHaveBeenCalled()
  })
})
