import { createStore } from '@tanstack/store'

const STORAGE_KEY = 'partsrelay.token'

const store = createStore<{ token: string | null }>({
  token: window.localStorage.getItem(STORAGE_KEY),
})

export const session = {
  store,
  getToken: () => store.state.token,
  signIn: (token: string) => {
    window.localStorage.setItem(STORAGE_KEY, token)
    store.setState(() => ({ token }))
  },
  signOut: () => {
    window.localStorage.removeItem(STORAGE_KEY)
    store.setState(() => ({ token: null }))
  },
}
