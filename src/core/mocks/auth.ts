import { isFuture } from 'date-fns'
import { http, HttpResponse, type JsonBodyType } from 'msw'
import { z } from 'zod'
import {
  daysAgo,
  newCompany,
  ironworksGarage,
  people,
  redwoodParts,
  setting,
  signedInAs,
  type Company,
  type Invitation,
  type Person,
  type Role,
} from '@/core/mocks/data'
import { capStrings, fail } from '@/core/mocks/errors'

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
    company: pending ? newCompany(me) : redwoodParts(),
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

function signedIn(state: World) {
  if (!state.signedIn) fail(401, 'unauthorized', 'Unauthorized')

  return state
}

const myRole = ({ company, me }: World) =>
  company.members.find(({ userId }) => userId === me.id)?.role

// The REST mocks act for the signed in member
export function signedInMember() {
  return world((state) =>
    state.signedIn ? { company: state.company.slug, role: myRole(state) } : null
  )
}

function ownerOnly(state: World, code: string, message: string) {
  if (myRole(state) !== 'owner') fail(403, code, message)
}

const MANAGES: Record<string, string[]> = { owner: ['admin', 'viewer'], admin: ['viewer'] }

function managed(state: World, role: string | undefined) {
  if (!MANAGES[myRole(state) ?? '']?.includes(role ?? '')) {
    fail(403, 'workspace-role-not-managed', 'Your role cannot manage members with this role')
  }
}

const live = (invitation: Invitation) =>
  invitation.status === 'pending' && isFuture(invitation.expiresAt)

type Offer = Omit<Invitation, 'role'> & { role: Role; organizationName: string }

const offers = ({ offered, me }: World): Offer[] =>
  offered
    ? [
        {
          id: '31',
          organizationId: '3',
          organizationName: 'Ironworks Garage Ltd',
          email: me.email,
          role: 'admin',
          status: 'pending',
          inviterId: people.steven.id,
          createdAt: daysAgo(2),
          expiresAt: daysAgo(-5),
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

const respond = (resolve: Resolve) => async (info: { request: Request }) => {
  await capStrings(info.request)

  return HttpResponse.json((await resolve(info)) as JsonBodyType)
}

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
              expiresAt: daysAgo(-7),
              createdAt: daysAgo(0),
              updatedAt: daysAgo(0),
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
      ownerOnly(
        state,
        'you-are-not-allowed-to-update-this-organization',
        'You are not allowed to update this organization'
      )
      if (data.locale != null && data.locale !== 'en-US' && data.locale !== 'it-IT') {
        fail(400, 'locale-not-supported', 'The locale is not supported')
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
      const target = company.members.find((item) => item.id === memberId)
      if (!target) fail(400, 'member-not-found', 'Member not found')
      ownerOnly(
        state,
        'you-are-not-allowed-to-update-this-member',
        'You are not allowed to update this member'
      )
      // The core allows only the ownership transfer
      if (role !== 'owner') {
        fail(
          403,
          'role-change-not-allowed',
          'Roles are fixed, only the ownership can be transferred'
        )
      }

      // The core hands the old owner admin rights
      for (const item of company.members) if (item.role === 'owner') item.role = 'admin'
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
      if (!target) fail(400, 'member-not-found', 'Member not found')
      if (target.role === 'owner') {
        fail(
          400,
          'you-cannot-leave-the-organization-as-the-only-owner',
          'You cannot leave the organization as the only owner'
        )
      }
      if (myRole(state) === 'viewer') {
        fail(
          401,
          'you-are-not-allowed-to-delete-this-member',
          'You are not allowed to delete this member'
        )
      }
      managed(state, target.role)

      company.members = company.members.filter((item) => item !== target)
      company.invitations = company.invitations.filter((item) => item.inviterId !== target.userId)
      const { user: _user, ...member } = target

      return { member }
    })
  }),
  post('/organization/invite-member', async ({ request }) => {
    const {
      email: typed,
      role,
      resend,
    } = await body<{
      email: string
      role: Invitation['role']
      resend?: boolean
    }>(request)
    // Like Better Auth: lowercased, then checked
    const email = typed.toLowerCase()

    return world((state) => {
      const { company, me } = signedIn(state)
      if (!z.email().safeParse(email).success) fail(400, 'invalid-email', 'Invalid email')
      if (myRole(state) === 'viewer') {
        fail(
          403,
          'you-are-not-allowed-to-invite-users-to-this-organization',
          'You are not allowed to invite users to this organization'
        )
      }
      if (company.members.some(({ user }) => user.email.toLowerCase() === email)) {
        fail(
          400,
          'user-is-already-a-member-of-this-organization',
          'User is already a member of this organization'
        )
      }

      // Like the core, an expired invitation no longer counts
      const expiresAt = daysAgo(-7)
      const pending = company.invitations.find(
        (item) => item.email.toLowerCase() === email && live(item)
      )
      if (pending && !resend) {
        fail(
          400,
          'user-is-already-invited-to-this-organization',
          'User is already invited to this organization'
        )
      }
      managed(state, role)
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
      if (!invitation) fail(400, 'invitation-not-found', 'Invitation not found')
      if (myRole(state) === 'viewer') {
        fail(
          403,
          'you-are-not-allowed-to-cancel-this-invitation',
          'You are not allowed to cancel this invitation'
        )
      }
      managed(state, invitation.role)
      invitation.status = 'canceled'

      return invitation
    })
  }),
  post('/organization/delete', () =>
    world((state) => {
      const { company } = signedIn(state)
      ownerOnly(
        state,
        'you-are-not-allowed-to-delete-this-organization',
        'You are not allowed to delete this organization'
      )
      const { members: _members, invitations: _invitations, ...organization } = company
      endAccount(state)

      return organization
    })
  ),
  post('/organization/leave', () =>
    world((state) => {
      const { company, me } = signedIn(state)
      const target = company.members.find(({ userId }) => userId === me.id)
      if (!target) fail(400, 'member-not-found', 'Member not found')
      if (target.role === 'owner') {
        fail(
          400,
          'you-cannot-leave-the-organization-as-the-only-owner',
          'You cannot leave the organization as the only owner'
        )
      }
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
        return { ...offer, organizationSlug: 'ironworks-garage', inviterEmail: people.steven.email }
      }

      if (company.invitations.some((item) => item.id === id && live(item))) {
        fail(
          403,
          'you-are-not-the-recipient-of-the-invitation',
          'You are not the recipient of the invitation'
        )
      }
      fail(400, 'bad-request', 'Invitation not found!')
    })
  }),
  post('/organization/accept-invitation', async ({ request }) => {
    const { invitationId } = await body<{ invitationId: string }>(request)

    return world((state) => {
      const invitation = offers(signedIn(state)).find((item) => item.id === invitationId)
      if (!invitation) fail(400, 'invitation-not-found', 'Invitation not found')
      if (state.company.members.length > 1) {
        fail(
          403,
          'workspace-not-releasable',
          'Only a personal company without other members can be left to join another one'
        )
      }

      state.offered = false
      state.company = ironworksGarage(state.me, invitation.role)

      return {
        invitation: { ...invitation, status: 'accepted' },
        member: state.company.members.at(-1),
      }
    })
  }),
]
