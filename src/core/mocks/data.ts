import { subDays } from 'date-fns'

// Shapes of the Better Auth JSON the mocks send
export type Role = 'owner' | 'admin' | 'viewer'

export type Person = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: string
  updatedAt: string
}

export type Member = {
  id: string
  organizationId: string
  userId: string
  role: Role
  createdAt: string
  user: { id: string; name: string; email: string; image?: string | null }
}

export type Invitation = {
  id: string
  organizationId: string
  email: string
  role: Exclude<Role, 'owner'>
  status: 'pending' | 'accepted' | 'rejected' | 'canceled'
  inviterId: string
  createdAt: string
  expiresAt: string
}

export type Company = {
  id: string
  name: string
  slug: string
  metadata: string
  locale: string
  createdAt: string
  members: Member[]
  invitations: Invitation[]
}

// Days before now, negative for the future
export const daysAgo = (days: number) => subDays(new Date(), days).toISOString()

// localStorage switches: user owner|admin|viewer|new, setup pending, invitation 1
export const setting = (name: 'user' | 'setup' | 'invitation') =>
  localStorage.getItem(`mock.${name}`)

const person = (id: string, name: string, email: string): Person => ({
  id,
  name,
  email,
  emailVerified: true,
  createdAt: daysAgo(400),
  updatedAt: daysAgo(1),
})

export const people = {
  mark: person('1', 'Mark Reed', 'mark.reed@redwoodparts.com'),
  julia: person('2', 'Julia Bennett', 'julia.bennett@redwoodparts.com'),
  luke: person('3', 'Luke Foster', 'luke.foster@gmail.com'),
  sarah: person('4', 'Sarah Collins', 'sarah.collins@redwoodparts.com'),
  steven: person('9', 'Steven Hale', 's.hale@ironworksgarage.com'),
  newcomer: person('12', '', 'north.garage@gmail.com'),
}

const users = {
  owner: people.mark,
  admin: people.julia,
  viewer: people.sarah,
  new: people.newcomer,
}

export const signedInAs = () => users[setting('user') as keyof typeof users] ?? people.mark

export const member = (
  organizationId: string,
  id: string,
  { id: userId, name, email }: Person,
  role: Role,
  createdAt: string
): Member => ({
  id,
  organizationId,
  userId,
  role,
  createdAt,
  user: { id: userId, name, email },
})

const invitation = (
  id: string,
  email: string,
  role: Invitation['role'],
  sentDaysAgo: number,
  status: Invitation['status'] = 'pending'
): Invitation => ({
  id,
  organizationId: '1',
  email,
  role,
  status,
  inviterId: people.mark.id,
  createdAt: daysAgo(sentDaysAgo),
  expiresAt: daysAgo(sentDaysAgo - 7),
})

export const redwoodParts = (): Company => ({
  id: '1',
  name: 'Redwood Parts Ltd',
  slug: 'redwood-parts',
  metadata: '{"setup":"done"}',
  locale: 'en',
  createdAt: daysAgo(400),
  members: [
    member('1', '1', people.mark, 'owner', daysAgo(400)),
    member('1', '2', people.julia, 'admin', daysAgo(388)),
    member('1', '3', people.luke, 'viewer', daysAgo(122)),
    member('1', '4', people.sarah, 'viewer', daysAgo(31)),
  ],
  invitations: [
    invitation('7', 'f.roberts@redwoodparts.com', 'viewer', 1),
    invitation('6', 'a.evans@redwoodparts.com', 'admin', 3),
    invitation('5', 'north.garage@gmail.com', 'viewer', 9),
    invitation('4', 'luke.foster@gmail.com', 'viewer', 125, 'accepted'),
    invitation('3', 'p.green@redwoodparts.com', 'viewer', 40, 'canceled'),
    invitation('2', 'm.baker@gmail.com', 'admin', 60, 'rejected'),
  ],
})

export function newCompany(owner: Person): Company {
  const createdAt = new Date().toISOString()

  return {
    id: '2',
    name: owner.name || owner.email,
    slug: crypto.randomUUID(),
    metadata: '{"setup":"pending"}',
    locale: 'en',
    createdAt,
    members: [member('2', '10', owner, 'owner', createdAt)],
    invitations: [],
  }
}

export function ironworksGarage(newMember: Person, role: Role): Company {
  return {
    id: '3',
    name: 'Ironworks Garage Ltd',
    slug: 'ironworks-garage',
    metadata: '{"setup":"done"}',
    locale: 'en',
    createdAt: daysAgo(700),
    members: [
      member('3', '20', people.steven, 'owner', daysAgo(700)),
      member('3', '21', newMember, role, new Date().toISOString()),
    ],
    invitations: [],
  }
}
