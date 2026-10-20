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
  marco: person('1', 'Marco Rossi', 'marco.rossi@ricambirossi.it'),
  giulia: person('2', 'Giulia Bianchi', 'giulia.bianchi@ricambirossi.it'),
  luca: person('3', 'Luca Ferri', 'luca.ferri@gmail.com'),
  sara: person('4', 'Sara Conti', 'sara.conti@ricambirossi.it'),
  stefano: person('9', 'Stefano Ferri', 's.ferri@officinaferri.it'),
  newcomer: person('12', '', 'officina.neri@gmail.com'),
}

const users = {
  owner: people.marco,
  admin: people.giulia,
  viewer: people.sara,
  new: people.newcomer,
}

export const signedInAs = () => users[setting('user') as keyof typeof users] ?? people.marco

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
  inviterId: people.marco.id,
  createdAt: daysAgo(sentDaysAgo),
  expiresAt: daysAgo(sentDaysAgo - 7),
})

export const ricambiRossi = (): Company => ({
  id: '1',
  name: 'Ricambi Rossi S.r.l.',
  slug: 'ricambi-rossi',
  metadata: '{"setup":"done"}',
  locale: 'en',
  createdAt: daysAgo(400),
  members: [
    member('1', '1', people.marco, 'owner', daysAgo(400)),
    member('1', '2', people.giulia, 'admin', daysAgo(388)),
    member('1', '3', people.luca, 'viewer', daysAgo(122)),
    member('1', '4', people.sara, 'viewer', daysAgo(31)),
  ],
  invitations: [
    invitation('7', 'f.romano@ricambirossi.it', 'viewer', 1),
    invitation('6', 'a.esposito@ricambirossi.it', 'admin', 3),
    invitation('5', 'officina.neri@gmail.com', 'viewer', 9),
    invitation('4', 'luca.ferri@gmail.com', 'viewer', 125, 'accepted'),
    invitation('3', 'p.galli@ricambirossi.it', 'viewer', 40, 'canceled'),
    invitation('2', 'm.bassi@gmail.com', 'admin', 60, 'rejected'),
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

export function officinaFerri(newMember: Person, role: Role): Company {
  return {
    id: '3',
    name: 'Officina Ferri S.r.l.',
    slug: 'officina-ferri',
    metadata: '{"setup":"done"}',
    locale: 'it',
    createdAt: daysAgo(700),
    members: [
      member('3', '20', people.stefano, 'owner', daysAgo(700)),
      member('3', '21', newMember, role, new Date().toISOString()),
    ],
    invitations: [],
  }
}
