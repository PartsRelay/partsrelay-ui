import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { legalLinks } from '@/core/legal'
import { ExternalLink } from '@/ui/components/external-link'

export function LegalFooter() {
  const { t } = useTranslation()
  const links = legalLinks()

  if (links.length === 0) return null

  return (
    <footer className="flex flex-wrap justify-center gap-x-2 p-4 text-sm text-muted-foreground">
      {links.map(({ id, url }, index) => (
        <Fragment key={id}>
          {index > 0 && <span aria-hidden>·</span>}
          <ExternalLink href={url}>{t(`app.legal.${id}`)}</ExternalLink>
        </Fragment>
      ))}
    </footer>
  )
}
