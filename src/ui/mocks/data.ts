export const DAY = 86_400_000

export const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

export const setting = (name: 'user' | 'setup' | 'invitation') =>
  localStorage.getItem(`mock.${name}`)

const SIGNED_OUT = 'mock.signedOut'

export const mockSession = {
  active: () => sessionStorage.getItem(SIGNED_OUT) === null,
  start: () => sessionStorage.removeItem(SIGNED_OUT),
  end: () => sessionStorage.setItem(SIGNED_OUT, '1'),
}

const person = (id: string, name: string, email: string) => ({
  id,
  name,
  email,
  emailVerified: true,
  image: null as string | null,
  createdAt: ago(400 * DAY),
  updatedAt: ago(DAY),
})

export type Person = ReturnType<typeof person>

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

export const me = () => users[setting('user') as keyof typeof users] ?? people.marco

export const member = (
  organizationId: string,
  id: string,
  user: Person,
  role: string,
  createdAt: string
) => ({
  id,
  organizationId,
  userId: user.id,
  role,
  createdAt,
  user,
})

export type Member = ReturnType<typeof member>

const invitation = (
  id: string,
  email: string,
  role: string,
  sentDaysAgo: number,
  status = 'pending'
) => ({
  id,
  organizationId: '1',
  email,
  role,
  status,
  inviterId: people.marco.id,
  createdAt: ago(sentDaysAgo * DAY),
  expiresAt: ago((sentDaysAgo - 7) * DAY),
})

export type Invitation = ReturnType<typeof invitation>

export type Company = {
  organization: {
    id: string
    name: string
    slug: string
    logo: string | null
    metadata: string
    locale: string
    createdAt: string
  }
  members: Member[]
  invitations: Invitation[]
}

export const ricambiRossi: Company = {
  organization: {
    id: '1',
    name: 'Ricambi Rossi S.r.l.',
    slug: 'ricambi-rossi',
    logo: null,
    metadata: '{"setup":"done"}',
    locale: 'en',
    createdAt: ago(400 * DAY),
  },
  members: [
    member('1', '1', people.marco, 'owner', ago(400 * DAY)),
    member('1', '2', people.giulia, 'admin', ago(388 * DAY)),
    member('1', '3', people.luca, 'viewer', ago(122 * DAY)),
    member('1', '4', people.sara, 'viewer', ago(31 * DAY)),
  ],
  invitations: [
    invitation('7', 'f.romano@ricambirossi.it', 'viewer', 1),
    invitation('6', 'a.esposito@ricambirossi.it', 'admin', 3),
    invitation('5', 'officina.neri@gmail.com', 'viewer', 9),
    invitation('4', 'luca.ferri@gmail.com', 'viewer', 125, 'accepted'),
    invitation('3', 'p.galli@ricambirossi.it', 'viewer', 40, 'canceled'),
    invitation('2', 'm.bassi@gmail.com', 'admin', 60, 'rejected'),
  ],
}

export function newCompany(owner: Person): Company {
  const createdAt = new Date().toISOString()

  return {
    organization: {
      id: '2',
      name: owner.name || owner.email,
      slug: crypto.randomUUID(),
      logo: null,
      metadata: '{"setup":"pending"}',
      locale: 'en',
      createdAt,
    },
    members: [member('2', '10', owner, 'owner', createdAt)],
    invitations: [],
  }
}

export function officinaFerri(newMember: Person, role: string): Company {
  return {
    organization: {
      id: '3',
      name: 'Officina Ferri S.r.l.',
      slug: 'officina-ferri',
      logo: null,
      metadata: '{"setup":"done"}',
      locale: 'it',
      createdAt: ago(700 * DAY),
    },
    members: [
      member('3', '20', people.stefano, 'owner', ago(700 * DAY)),
      member('3', '21', newMember, role, new Date().toISOString()),
    ],
    invitations: [],
  }
}
