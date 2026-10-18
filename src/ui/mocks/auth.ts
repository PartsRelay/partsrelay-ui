import { http, HttpResponse, type JsonBodyType } from 'msw'
import {
  ago,
  type Company,
  DAY,
  me,
  mockSession,
  newCompany,
  officinaFerri,
  people,
  ricambiRossi,
  setting,
} from '@/ui/mocks/data'

let startup: Company | undefined
let moved: Company | undefined
let offered = true

const pendingSetup = () => setting('setup') === 'pending' || me() === people.newcomer

export const company = () =>
  moved ?? (pendingSetup() ? (startup ??= newCompany(me())) : ricambiRossi)

const offers = () =>
  setting('invitation') === '1' && offered
    ? [
        {
          id: '31',
          organizationId: '3',
          organizationName: 'Officina Ferri S.r.l.',
          email: me().email,
          role: 'admin',
          status: 'pending',
          inviterId: people.stefano.id,
          createdAt: ago(2 * DAY),
          expiresAt: ago(-5 * DAY),
        },
      ]
    : []

const ok = (value: JsonBodyType = { success: true }) => HttpResponse.json(value)

const refuse = (status: number, code: string) =>
  HttpResponse.json({ code, message: code }, { status })

const signedOut = () => (mockSession.active() ? null : refuse(401, 'UNAUTHORIZED'))

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
              activeOrganizationId: company().organization.id,
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
  http.post('*/api/auth/sign-in/magic-link', () => ok({ status: true })),
  http.post('*/api/auth/sign-out', () => {
    mockSession.end()

    return ok()
  }),
  http.get('*/api/auth/organization/get-full-organization', () => {
    const { organization, members, invitations } = company()

    return signedOut() ?? ok({ ...organization, members, invitations })
  }),
  http.get('*/api/auth/organization/get-invitation', ({ request }) => {
    const id = new URL(request.url).searchParams.get('id')
    const invitation = offers().find((item) => item.id === id)
    if (!mockSession.active()) return refuse(401, 'UNAUTHORIZED')
    if (invitation) return ok({ ...invitation, inviterEmail: people.stefano.email })

    return company().invitations.some((item) => item.id === id && item.status === 'pending')
      ? refuse(403, 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION')
      : HttpResponse.json({ message: 'Invitation not found!' }, { status: 400 })
  }),
  http.post<never, { invitationId: string }>(
    '*/api/auth/organization/accept-invitation',
    async ({ request }) => {
      const { invitationId } = await request.json()
      const invitation = offers().find((item) => item.id === invitationId)
      if (!invitation) return refuse(400, 'INVITATION_NOT_FOUND')
      if (company().members.length > 1) return refuse(403, 'WORKSPACE_NOT_RELEASABLE')

      offered = false
      moved = officinaFerri(me(), invitation.role)

      return ok({ invitation: { ...invitation, status: 'accepted' }, member: moved.members.at(-1) })
    }
  ),
]
