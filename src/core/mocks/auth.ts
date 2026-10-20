import { http, HttpResponse, type JsonBodyType } from 'msw'
import {
  ago,
  DAY,
  newCompany,
  officinaFerri,
  people,
  ricambiRossi,
  setting,
  signedInAs,
  type Company,
  type Invitation,
  type Person,
  type Role,
} from '@/core/mocks/data'

type World = {
  signedIn: boolean
  me: Person
  company: Company
  offered: boolean
  nextInvitation: number
}

const worldKey = () =>
  `mock.world.${(['user', 'setup', 'invitation'] as const).map(setting).join('.')}`

function freshWorld(): World {
  const me = signedInAs()
  const pending = setting('setup') === 'pending' || me === people.newcomer

  return {
    signedIn: true,
    me,
    company: pending ? newCompany(me) : ricambiRossi(),
    offered: setting('invitation') === '1',
    nextInvitation: 100,
  }
}

// Kept in sessionStorage, sign in reloads the page
function world<T>(change: (state: World) => T): T {
  const saved = sessionStorage.getItem(worldKey())
  const state: World = saved ? JSON.parse(saved) : freshWorld()
  const result = change(state)
  sessionStorage.setItem(worldKey(), JSON.stringify(state))

  return result
}

// Errors in the shape the core sends
function fail(status: number, code: string, message = code): never {
  throw HttpResponse.json({ code, status, message }, { status })
}

function signedIn(state: World) {
  if (!state.signedIn) fail(401, 'UNAUTHORIZED')

  return state
}

const myRole = ({ company, me }: World) =>
  company.members.find(({ userId }) => userId === me.id)?.role

function ownerOnly(state: World, code: string) {
  if (myRole(state) !== 'owner') fail(403, code)
}

const MANAGES: Record<string, string[]> = { owner: ['admin', 'viewer'], admin: ['viewer'] }

function managed(state: World, role: string | undefined) {
  if (!MANAGES[myRole(state) ?? '']?.includes(role ?? '')) fail(403, 'WORKSPACE_ROLE_NOT_MANAGED')
}

const live = (invitation: Invitation) =>
  invitation.status === 'pending' && new Date(invitation.expiresAt) > new Date()

type Offer = Omit<Invitation, 'role'> & { role: Role; organizationName: string }

const offers = ({ offered, me }: World): Offer[] =>
  offered
    ? [
        {
          id: '31',
          organizationId: '3',
          organizationName: 'Officina Ferri S.r.l.',
          email: me.email,
          role: 'admin',
          status: 'pending',
          inviterId: people.stefano.id,
          createdAt: ago(2 * DAY),
          expiresAt: ago(-5 * DAY),
        },
      ]
    : []

// The core deletes the account, signing in again starts over
function endAccount(state: World) {
  state.company = newCompany(state.me)
  state.signedIn = false
}

const body = <T>(request: Request) => request.json() as Promise<T>

type Resolve = (info: { request: Request }) => unknown

const respond = (resolve: Resolve) => async (info: { request: Request }) =>
  HttpResponse.json((await resolve(info)) as JsonBodyType)

const get = (path: string, resolve: Resolve) => http.get(`*/api/auth${path}`, respond(resolve))

const post = (path: string, resolve: Resolve) => http.post(`*/api/auth${path}`, respond(resolve))

export const authMocks = [
  get('/get-session', () =>
    world(({ signedIn, me, company }) =>
      signedIn
        ? {
            user: me,
            session: {
              id: '1',
              token: 'mock',
              userId: me.id,
              activeOrganizationId: company.id,
              expiresAt: ago(-7 * DAY),
              createdAt: ago(0),
              updatedAt: ago(0),
            },
          }
        : null
    )
  ),
  post('/sign-in/social', async ({ request }) => {
    const { callbackURL } = await body<{ callbackURL?: string }>(request)

    return world((state) => {
      state.signedIn = true

      return { url: callbackURL, redirect: true }
    })
  }),
  post('/one-tap/callback', () =>
    world((state) => {
      state.signedIn = true

      return { token: 'mock', user: state.me }
    })
  ),
  post('/sign-in/magic-link', () => ({ status: true })),
  post('/sign-out', () =>
    world((state) => {
      state.signedIn = false

      return { success: true }
    })
  ),
  get('/organization/get-full-organization', () => world((state) => signedIn(state).company)),
  post('/update-user', async ({ request }) => {
    const { name } = await body<{ name?: string }>(request)

    return world((state) => {
      const { me, company } = signedIn(state)
      if (name === undefined) return { status: true }

      me.name = name
      for (const { user } of company.members) if (user.id === me.id) user.name = name

      return { status: true }
    })
  }),
  post('/organization/update', async ({ request }) => {
    const { data } = await body<{
      data: { name?: string; locale?: string | null; metadata?: object }
    }>(request)

    return world((state) => {
      const { company } = signedIn(state)
      ownerOnly(state, 'YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION')
      if (data.locale != null && data.locale !== 'en' && data.locale !== 'it') {
        fail(400, 'LOCALE_NOT_SUPPORTED')
      }

      if (data.name !== undefined) company.name = data.name
      if (data.locale != null) company.locale = data.locale
      if (data.metadata !== undefined) company.metadata = JSON.stringify(data.metadata)
      const { members: _members, invitations: _invitations, ...organization } = company

      return organization
    })
  }),
  post('/organization/update-member-role', async ({ request }) => {
    const { memberId, role } = await body<{ memberId: string; role: Role }>(request)

    return world((state) => {
      const { company } = signedIn(state)
      ownerOnly(state, 'YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER')
      const target = company.members.find((item) => item.id === memberId)
      if (!target) fail(400, 'MEMBER_NOT_FOUND')

      // The core hands the old owner admin rights
      if (role === 'owner') {
        for (const item of company.members) if (item.role === 'owner') item.role = 'admin'
      }
      target.role = role
      const { user: _user, ...member } = target

      return member
    })
  }),
  post('/organization/remove-member', async ({ request }) => {
    const { memberIdOrEmail } = await body<{ memberIdOrEmail: string }>(request)

    return world((state) => {
      const { company } = signedIn(state)
      const target = company.members.find((item) => item.id === memberIdOrEmail)
      if (!target) fail(400, 'MEMBER_NOT_FOUND')
      if (myRole(state) === 'viewer') fail(401, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER')
      managed(state, target.role)

      company.members = company.members.filter((item) => item !== target)
      company.invitations = company.invitations.filter((item) => item.inviterId !== target.userId)
      const { user: _user, ...member } = target

      return { member }
    })
  }),
  post('/organization/invite-member', async ({ request }) => {
    const { email, role, resend } = await body<{
      email: string
      role: Invitation['role']
      resend?: boolean
    }>(request)

    return world((state) => {
      const { company, me } = signedIn(state)
      if (myRole(state) === 'viewer') {
        fail(403, 'YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION')
      }
      managed(state, role)
      if (company.members.some(({ user }) => user.email === email)) {
        fail(400, 'USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION')
      }

      // Like the core, an expired invitation no longer counts
      const expiresAt = ago(-7 * DAY)
      const pending = company.invitations.find((item) => item.email === email && live(item))
      if (pending && !resend) fail(400, 'USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION')
      if (pending) return Object.assign(pending, { expiresAt })

      const invitation: Invitation = {
        id: String(state.nextInvitation++),
        organizationId: company.id,
        email,
        role,
        status: 'pending',
        inviterId: me.id,
        createdAt: new Date().toISOString(),
        expiresAt,
      }
      company.invitations.push(invitation)

      return invitation
    })
  }),
  post('/organization/cancel-invitation', async ({ request }) => {
    const { invitationId } = await body<{ invitationId: string }>(request)

    return world((state) => {
      const { company } = signedIn(state)
      const invitation = company.invitations.find((item) => item.id === invitationId)
      if (!invitation) fail(400, 'INVITATION_NOT_FOUND')
      managed(state, invitation.role)
      invitation.status = 'canceled'

      return invitation
    })
  }),
  post('/organization/delete', () =>
    world((state) => {
      const { company } = signedIn(state)
      ownerOnly(state, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION')
      const { members: _members, invitations: _invitations, ...organization } = company
      endAccount(state)

      return organization
    })
  ),
  post('/organization/leave', () =>
    world((state) => {
      const { company, me } = signedIn(state)
      const target = company.members.find(({ userId }) => userId === me.id)
      if (!target) fail(400, 'MEMBER_NOT_FOUND')
      if (target.role === 'owner') fail(400, 'YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER')
      const { user: _user, ...member } = target
      endAccount(state)

      return member
    })
  ),
  get('/organization/list-user-invitations', () => world((state) => offers(signedIn(state)))),
  get('/organization/get-invitation', ({ request }) => {
    const id = new URL(request.url).searchParams.get('id')

    return world((state) => {
      const { company } = signedIn(state)
      const offer = offers(state).find((item) => item.id === id)
      if (offer) {
        return { ...offer, organizationSlug: 'officina-ferri', inviterEmail: people.stefano.email }
      }

      if (company.invitations.some((item) => item.id === id && live(item))) {
        fail(403, 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION')
      }
      fail(400, 'BAD_REQUEST', 'Invitation not found!')
    })
  }),
  post('/organization/accept-invitation', async ({ request }) => {
    const { invitationId } = await body<{ invitationId: string }>(request)

    return world((state) => {
      const invitation = offers(signedIn(state)).find((item) => item.id === invitationId)
      if (!invitation) fail(400, 'INVITATION_NOT_FOUND')
      if (state.company.members.length > 1) fail(403, 'WORKSPACE_NOT_RELEASABLE')

      state.offered = false
      state.company = officinaFerri(state.me, invitation.role)

      return {
        invitation: { ...invitation, status: 'accepted' },
        member: state.company.members.at(-1),
      }
    })
  }),
]
