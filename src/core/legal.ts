import { type Env, env } from '@/env'

type LegalUrls = Pick<Env, 'SUPPORT_URL' | 'PRIVACY_URL' | 'TERMS_URL'>

export type LegalLink = { id: 'help' | 'privacy' | 'terms'; url: string }

export function legalLinks({ SUPPORT_URL, PRIVACY_URL, TERMS_URL }: LegalUrls = env) {
  const links = [
    { id: 'help', url: SUPPORT_URL },
    { id: 'privacy', url: PRIVACY_URL },
    { id: 'terms', url: TERMS_URL },
  ] as const

  return links.filter((link): link is LegalLink => link.url !== undefined)
}
