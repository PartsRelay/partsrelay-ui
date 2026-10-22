import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/ui/components/ui/badge'
import '@/modules/auth/ui/login.css'

export function SetupLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  return (
    <div className="setup-page">
      <header className="setup-header">
        <img src="/brand/logo-dark.png" alt="Parts Relay" width="196" height="48" />
        <Badge variant="secondary">{t('design.setup.workspace')}</Badge>
      </header>
      <main className="setup-layout">
        <section className="setup-orientation" aria-labelledby="setup-orientation-title">
          <p className="eyebrow">{t('design.setup.label')}</p>
          <h1 id="setup-orientation-title">{t('design.setup.headline')}</h1>
          <p className="setup-description">{t('design.setup.description')}</p>
          <ol className="setup-steps">
            {[1, 2, 3].map((step) => (
              <li className="setup-step" key={step} aria-current={step === 1 ? 'step' : undefined}>
                <span aria-hidden>{String(step).padStart(2, '0')}</span>
                <strong>{t('design.setup.step' + step)}</strong>
              </li>
            ))}
          </ol>
        </section>
        {children}
      </main>
    </div>
  )
}
