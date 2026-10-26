import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { cn } from 'cn'
import { BookUserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pageInfo } from '@/core/pagination'
import { type ContactRow, contactRow } from '@/modules/contacts/core/contact-row'
import { type ContactTab, contactTabs, tabStatus } from '@/modules/contacts/core/contacts'
import { contactListParams, contactsQuery } from '@/modules/contacts/core/contacts.query'
import { AddContactDialog } from '@/modules/contacts/ui/add-contact-dialog'
import { BlockContactDialog } from '@/modules/contacts/ui/block-contact-dialog'
import { ContactsTable } from '@/modules/contacts/ui/contacts-table'
import { RemoveContactDialog } from '@/modules/contacts/ui/remove-contact-dialog'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { LoadError, RefetchError } from '@/ui/components/load-error'
import { PaginationBar } from '@/ui/components/pagination-bar'
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

const route = getRouteApi('/_app/(contacts)/contacts')

type Confirmation = { action: 'block' | 'remove'; row: ContactRow }

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
  const rows = list.data?.data.map((contact) => contactRow(contact, me, i18n.language))
  const heading = useRef<HTMLHeadingElement>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [confirming, setConfirming] = useState(false)
  const confirm = (action: Confirmation['action']) => (row: ContactRow) => {
    setConfirmation({ action, row })
    setConfirming(true)
  }
  const close = () => setConfirming(false)
  const retry = () => void list.refetch()

  useEffect(() => {
    if (lastPage) void navigate({ search: (prev) => ({ ...prev, page: lastPage }), replace: true })
  }, [lastPage, navigate])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 ref={heading} tabIndex={-1} className="outline-none">
            {t('contacts.list.title')}
          </h2>
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
              <TabsTrigger key={item} value={item} className="text-muted-foreground">
                {t(`contacts.tabs.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent
            value={tab}
            aria-busy={list.isPlaceholderData}
            className={cn('grid gap-4', list.isPlaceholderData && 'opacity-60')}
          >
            {list.isRefetchError && (
              <RefetchError error={list.error} onRetry={retry}>
                {t('contacts.list.stale')}
              </RefetchError>
            )}
            {list.data && rows && !info?.outOfRange ? (
              rows.length > 0 ? (
                <>
                  <ContactsTable
                    rows={rows}
                    onBlock={confirm('block')}
                    onRemove={confirm('remove')}
                  />
                  <PaginationBar metadata={list.data.metadata} />
                </>
              ) : (
                <NoContacts tab={tab} />
              )
            ) : list.isLoadingError ? (
              <LoadError error={list.error} onRetry={retry} />
            ) : (
              <Skeleton className="h-48 w-full" />
            )}
          </TabsContent>
        </Tabs>
        {confirmation?.action === 'block' && (
          <BlockContactDialog
            key={confirmation.row.contact.id}
            row={confirmation.row}
            open={confirming}
            onClose={close}
            returnTo={heading}
          />
        )}
        {confirmation?.action === 'remove' && (
          <RemoveContactDialog
            key={confirmation.row.contact.id}
            row={confirmation.row}
            open={confirming}
            onClose={close}
            returnTo={heading}
          />
        )}
      </CardContent>
    </Card>
  )
}
