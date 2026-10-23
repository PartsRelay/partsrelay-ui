import { useTranslation } from 'react-i18next'
import { ContactDirectory } from '@/modules/contacts/ui/contact-directory'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { PageHeader } from '@/ui/components/page-header'
import { Badge } from '@/ui/components/ui/badge'

export function ContactsPage() {
  const { t } = useTranslation()
  const { me } = useMe()

  return (
    <>
      <PageHeader
        title={t('contacts.title')}
        description={t('contacts.description')}
        badge={
          !me.permissions.manageContacts && (
            <Badge variant="secondary">{t('contacts.view-only')}</Badge>
          )
        }
      />
      <ContactDirectory />
    </>
  )
}
