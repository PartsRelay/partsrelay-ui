import { HttpResponse } from 'msw'
import {
  getGetSessionMockHandler,
  getSignOutMockHandler,
  getSocialSignInMockHandler,
  getUpdateUserMockHandler,
} from '@/core/api/auth/endpoints/default/default.msw'
import { getSignInWithMagicLinkMockHandler } from '@/core/api/auth/endpoints/magic-link/magic-link.msw'
import { getPostOneTapCallbackMockHandler } from '@/core/api/auth/endpoints/one-tap/one-tap.msw'
import {
  getCreateOrganizationInvitationMockHandler,
  getGetFullOrganizationMockHandler,
  getGetOrganizationGetInvitationMockHandler,
  getGetOrganizationListUserInvitationsMockHandler,
  getPostOrganizationAcceptInvitationMockHandler,
  getPostOrganizationCancelInvitationMockHandler,
  getPostOrganizationDeleteMockHandler,
  getPostOrganizationLeaveMockHandler,
  getPostOrganizationRemoveMemberMockHandler,
  getPostOrganizationUpdateMockHandler,
  getUpdateOrganizationMemberRoleMockHandler,
} from '@/core/api/auth/endpoints/organization/organization.msw'
import type {
  CreateOrganizationInvitationBody,
  FullOrganization,
  GetOrganizationListUserInvitations200Item,
  Invitation,
  MemberRole,
  PostOrganizationAcceptInvitationBody,
  PostOrganizationCancelInvitationBody,
  PostOrganizationRemoveMemberBody,
  PostOrganizationUpdateBody,
  SocialSignInBody,
  UpdateOrganizationMemberRoleBody,
  UpdateUserBody,
  User,
} from '@/core/api/auth/models'
import {
  ago,
  DAY,
  newCompany,
  officinaFerri,
  people,
  ricambiRossi,
  setting,
  signedInAs,
} from '@/core/mocks/data'

type World = {
  signedIn: boolean
  me: User
  company: FullOrganization
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

const refuse = (status: number, code: string) =>
  HttpResponse.json({ code, message: code }, { status })

function fail(status: number, code: string): never {
  throw refuse(status, code)
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

const offers = ({ offered, me }: World): GetOrganizationListUserInvitations200Item[] =>
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

export const authMocks = [
  getGetSessionMockHandler(() =>
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
  getSocialSignInMockHandler(async ({ request }) => {
    const { callbackURL } = await body<SocialSignInBody>(request)

    return world((state) => {
      state.signedIn = true

      return { url: callbackURL, redirect: true }
    })
  }),
  getPostOneTapCallbackMockHandler(() =>
    world((state) => {
      state.signedIn = true

      return { token: 'mock', user: state.me }
    })
  ),
  getSignInWithMagicLinkMockHandler({ status: true }),
  getSignOutMockHandler(() =>
    world((state) => {
      state.signedIn = false

      return { success: true }
    })
  ),
  getGetFullOrganizationMockHandler(() => world((state) => signedIn(state).company)),
  getUpdateUserMockHandler(async ({ request }) => {
    const { name } = await body<UpdateUserBody>(request)

    return world((state) => {
      const { me, company } = signedIn(state)
      if (name === undefined) return { status: true }

      me.name = name
      for (const { user } of company.members) if (user.id === me.id) user.name = name

      return { status: true }
    })
  }),
  getPostOrganizationUpdateMockHandler(async ({ request }) => {
    const { data } = await body<PostOrganizationUpdateBody>(request)

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
  getUpdateOrganizationMemberRoleMockHandler(async ({ request }) => {
    const { memberId, role } = await body<UpdateOrganizationMemberRoleBody & { role: MemberRole }>(
      request
    )

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
  getPostOrganizationRemoveMemberMockHandler(async ({ request }) => {
    const { memberIdOrEmail } = await body<PostOrganizationRemoveMemberBody>(request)

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
  getCreateOrganizationInvitationMockHandler(async ({ request }) => {
    const { email, role, resend } = await body<
      CreateOrganizationInvitationBody & { role: Invitation['role'] }
    >(request)

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
      if (pending) return { ...Object.assign(pending, { expiresAt }), role: pending.role ?? role }

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

      return { ...invitation, role }
    })
  }),
  getPostOrganizationCancelInvitationMockHandler(async ({ request }) => {
    const { invitationId } = await body<PostOrganizationCancelInvitationBody>(request)

    return world((state) => {
      const { company } = signedIn(state)
      const invitation = company.invitations.find((item) => item.id === invitationId)
      if (!invitation) fail(400, 'INVITATION_NOT_FOUND')
      managed(state, invitation.role)
      invitation.status = 'canceled'

      return invitation
    })
  }),
  getPostOrganizationDeleteMockHandler(() =>
    world((state) => {
      const { company } = signedIn(state)
      ownerOnly(state, 'YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION')
      const { members: _members, invitations: _invitations, ...organization } = company
      endAccount(state)

      return organization
    })
  ),
  getPostOrganizationLeaveMockHandler(() =>
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
  getGetOrganizationListUserInvitationsMockHandler(() => world((state) => offers(signedIn(state)))),
  getGetOrganizationGetInvitationMockHandler(({ request }) => {
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
      throw HttpResponse.json({ message: 'Invitation not found!' }, { status: 400 })
    })
  }),
  getPostOrganizationAcceptInvitationMockHandler(async ({ request }) => {
    const { invitationId } = await body<PostOrganizationAcceptInvitationBody>(request)

    return world((state) => {
      const invitation = offers(signedIn(state)).find((item) => item.id === invitationId)
      if (!invitation) fail(400, 'INVITATION_NOT_FOUND')
      if (state.company.members.length > 1) fail(403, 'WORKSPACE_NOT_RELEASABLE')

      state.offered = false
      state.company = officinaFerri(state.me, invitation.role as MemberRole)

      return {
        invitation: { ...invitation, status: 'accepted' },
        member: { ...state.company.members.at(-1) },
      }
    })
  }),
]
