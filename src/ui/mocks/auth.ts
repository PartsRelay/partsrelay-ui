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
let nextInvitation = 100

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

const myRole = () => company().members.find(({ userId }) => userId === me().id)?.role

const notOwner = (code: string) => (myRole() === 'owner' ? null : refuse(403, code))

const MANAGES: Record<string, string[]> = { owner: ['admin', 'viewer'], admin: ['viewer'] }

const unmanaged = (role: string) =>
  MANAGES[myRole() ?? '']?.includes(role) ? null : refuse(403, 'WORKSPACE_ROLE_NOT_MANAGED')

type OrganizationUpdate = { data: { name?: string; locale?: string; metadata?: object } }

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
  http.post<never, { name?: string }>('*/api/auth/update-user', async ({ request }) => {
    const { name } = await request.json()
    const refused = signedOut()
    if (refused) return refused
    if (name !== undefined) me().name = name

    return ok({ status: true })
  }),
  http.post<never, OrganizationUpdate>('*/api/auth/organization/update', async ({ request }) => {
    const { data } = await request.json()
    const { organization } = company()
    const refused = signedOut() ?? notOwner('YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION')
    if (refused) return refused
    if (data.locale !== undefined && !['en', 'it'].includes(data.locale)) {
      return refuse(400, 'LOCALE_NOT_SUPPORTED')
    }

    if (data.name !== undefined) organization.name = data.name
    if (data.locale !== undefined) organization.locale = data.locale
    if (data.metadata !== undefined) organization.metadata = JSON.stringify(data.metadata)

    return ok(organization)
  }),
  http.post<never, { memberId: string; role: string }>(
    '*/api/auth/organization/update-member-role',
    async ({ request }) => {
      const { memberId, role } = await request.json()
      const current = company()
      const refused = signedOut() ?? notOwner('YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER')
      if (refused) return refused

      current.members = current.members.map((item) => {
        if (item.id === memberId) return { ...item, role }

        return role === 'owner' && item.role === 'owner' ? { ...item, role: 'admin' } : item
      })

      return ok(current.members.find((item) => item.id === memberId))
    }
  ),
  http.post<never, { memberIdOrEmail: string }>(
    '*/api/auth/organization/remove-member',
    async ({ request }) => {
      const { memberIdOrEmail } = await request.json()
      const current = company()
      const member = current.members.find((item) => item.id === memberIdOrEmail)
      if (signedOut()) return refuse(401, 'UNAUTHORIZED')
      if (!member) return refuse(400, 'MEMBER_NOT_FOUND')
      if (myRole() === 'viewer') return refuse(401, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER')

      const refused = unmanaged(member.role)
      if (refused) return refused

      current.members = current.members.filter((item) => item !== member)
      current.invitations = current.invitations.filter((item) => item.inviterId !== member.userId)

      return ok({ member })
    }
  ),
  http.post<never, { email: string; role: string; resend?: boolean }>(
    '*/api/auth/organization/invite-member',
    async ({ request }) => {
      const { email, role, resend } = await request.json()
      const current = company()
      if (signedOut()) return refuse(401, 'UNAUTHORIZED')
      if (myRole() === 'viewer') {
        return refuse(403, 'YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION')
      }

      const refused = unmanaged(role)
      if (refused) return refused
      if (current.members.some(({ user }) => user.email === email)) {
        return refuse(400, 'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION')
      }

      const expiresAt = ago(-7 * DAY)
      const pending = current.invitations.find(
        (item) => item.email === email && item.status === 'pending'
      )
      if (pending && !resend) return refuse(400, 'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION')
      if (pending) return ok(Object.assign(pending, { expiresAt }))

      const invitation = {
        id: String(nextInvitation++),
        organizationId: current.organization.id,
        email,
        role,
        status: 'pending',
        inviterId: me().id,
        createdAt: new Date().toISOString(),
        expiresAt,
      }
      current.invitations.push(invitation)

      return ok(invitation)
    }
  ),
  http.post<never, { invitationId: string }>(
    '*/api/auth/organization/cancel-invitation',
    async ({ request }) => {
      const { invitationId } = await request.json()
      const invitation = company().invitations.find((item) => item.id === invitationId)
      if (signedOut()) return refuse(401, 'UNAUTHORIZED')
      if (!invitation) return refuse(400, 'INVITATION_NOT_FOUND')

      const refused = unmanaged(invitation.role)
      if (refused) return refused
      invitation.status = 'canceled'

      return ok(invitation)
    }
  ),
  http.post('*/api/auth/organization/delete', () => {
    const { organization } = company()
    const refused = signedOut() ?? notOwner('YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION')
    if (refused) return refused

    // Accounts are gone, signing in again starts over
    moved = newCompany(me())
    mockSession.end()

    return ok(organization)
  }),
  http.get('*/api/auth/organization/list-user-invitations', () => signedOut() ?? ok(offers())),
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
