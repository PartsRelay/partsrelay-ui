import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { cn } from 'cn'
import { BookUserIcon } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type ContactTab,
  contactRow,
  contactTabs,
  tabStatus,
} from '@/modules/core/contacts/contacts'
import { contactListParams, contactsQuery } from '@/modules/core/contacts/contacts.query'
import { pageInfo } from '@/modules/core/shared/pagination'
import { useMe } from '@/modules/ui/app/use-me'
import { AddContactDialog } from '@/modules/ui/contacts/add-contact-dialog'
import { ContactsTable } from '@/modules/ui/contacts/contacts-table'
import { LoadError } from '@/modules/ui/contacts/load-error'
import { PaginationBar } from '@/modules/ui/shared/pagination-bar'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/components/ui/empty'
import { Skeleton } from '@/ui/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/ui/tabs'

const route = getRouteApi('/_app/contacts')

function NoContacts({ tab }: { tab: ContactTab }) {
  const { t } = useTranslation()
  const { me } = useMe()
  const hint = me.permissions.manageContacts ? 'manager' : 'viewer'

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BookUserIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t(`contacts.empty.${tab}`)}</EmptyTitle>
        {tab === 'all' && <EmptyDescription>{t(`contacts.empty.${hint}`)}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  )
}

export function ContactDirectory() {
  const { t, i18n } = useTranslation()
  const { me } = useMe()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const list = useQuery(contactsQuery(contactListParams(search)))
  const info = list.data && pageInfo(list.data.metadata)
  const lastPage = info?.outOfRange ? info.pages : undefined
  const tab: ContactTab = search.status ?? 'all'
  const now = new Date()
  const rows = list.data?.data.map((contact) => contactRow(contact, me, now, i18n.language))

  useEffect(() => {
    if (lastPage) void navigate({ search: (prev) => ({ ...prev, page: lastPage }), replace: true })
  }, [lastPage, navigate])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('contacts.list.title')}</h2>
        </CardTitle>
        <CardDescription aria-live="polite">
          {info ? t('contacts.list.count', { count: info.total }) : t('contacts.list.description')}
        </CardDescription>
        {me.permissions.manageContacts && (
          <CardAction>
            <AddContactDialog />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(value) => void navigate({ search: { status: tabStatus(value) } })}
          className="gap-4"
        >
          <TabsList aria-label={t('contacts.tabs.label')}>
            {contactTabs.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`contacts.tabs.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent
            value={tab}
            aria-busy={list.isPlaceholderData || undefined}
            className={cn('grid gap-4', list.isPlaceholderData && 'opacity-60')}
          >
            {list.data && rows && !info?.outOfRange ? (
              rows.length > 0 ? (
                <>
                  <ContactsTable rows={rows} />
                  <PaginationBar
                    metadata={list.data.metadata}
                    onPage={(page) => void navigate({ search: (prev) => ({ ...prev, page }) })}
                  />
                </>
              ) : (
                <NoContacts tab={tab} />
              )
            ) : list.error ? (
              <LoadError error={list.error} onRetry={() => void list.refetch()} />
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
