const KEY = 'auth.token'

function storage() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export const authToken = {
  read: () => storage()?.getItem(KEY) ?? undefined,
  save: (token: string) => storage()?.setItem(KEY, token),
  clear: () => storage()?.removeItem(KEY),
  header: () => {
    const token = authToken.read()

    return token ? `Bearer ${token}` : undefined
  },
}
