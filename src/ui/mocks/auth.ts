import { http, HttpResponse, type JsonBodyType } from 'msw'
import { DAY, ago, me, mockSession } from '@/ui/mocks/data'

const ok = (value: JsonBodyType = { success: true }) => HttpResponse.json(value)

export const authMocks = [
  http.get('*/api/auth/get-session', () =>
    HttpResponse.json(
      mockSession.active()
        ? {
            user: me(),
            session: {
              id: '1',
              token: 'mock',
              userId: me().id,
              expiresAt: ago(-7 * DAY),
              createdAt: ago(0),
              updatedAt: ago(0),
            },
          }
        : null
    )
  ),
  http.post<never, { callbackURL: string }>('*/api/auth/sign-in/social', async ({ request }) => {
    mockSession.start()

    return ok({ url: (await request.json()).callbackURL, redirect: true })
  }),
  http.post('*/api/auth/sign-out', () => {
    mockSession.end()

    return ok()
  }),
]
