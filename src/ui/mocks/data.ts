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
}

const users = { owner: people.marco, admin: people.giulia, viewer: people.sara }

export const me = () => users[setting('user') as keyof typeof users] ?? people.marco
