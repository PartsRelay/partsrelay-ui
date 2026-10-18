import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { contactsSearchSchema } from '@/modules/core/contacts/contacts'
import { useMe } from '@/modules/ui/app/use-me'
import { ContactDirectory } from '@/modules/ui/contacts/contact-directory'
import { PageHeader } from '@/modules/ui/shared/page-header'
import { Badge } from '@/ui/components/ui/badge'

export const Route = createFileRoute('/_app/contacts')({
  validateSearch: contactsSearchSchema,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  staticData: { crumb: 'contacts' },
  component: ContactsPage,
})

function ContactsPage() {
  const { t } = useTranslation()
  const { me } = useMe()

  return (
    <>
      <PageHeader
        title={t('contacts.title')}
        description={t('contacts.description')}
        badge={
          !me.permissions.manageContacts && (
            <Badge variant="secondary">{t('contacts.viewOnly')}</Badge>
          )
        }
      />
      <ContactDirectory />
    </>
  )
}
