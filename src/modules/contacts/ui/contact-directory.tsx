import { Fragment, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  deleteApiV1WorkspaceContactsContactId,
  patchApiV1WorkspaceContactsContactId,
} from '@/core/api/endpoints/contacts/contacts'
import {
  type Contact,
  canManageContacts,
  contactName,
  contactStatuses,
  formatContactDate,
} from '@/modules/contacts/core/contacts'
import { contactsKey, contactsQuery } from '@/modules/contacts/core/contacts.query'
import { ContactFormDialog } from '@/modules/contacts/ui/contact-form-dialog'
import { searchKeys } from '@/modules/searches/core/searches.query'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { ConfirmDialog } from '@/ui/components/confirm-dialog'
import { PageHeader } from '@/ui/components/page-header'
import { useBetterAuthAction } from '@/ui/hooks/use-better-auth-action'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Spinner } from '@/ui/components/ui/spinner'
import '@/modules/contacts/ui/contacts.css'

const route = getRouteApi('/_app/contacts')
type Confirmation = { kind: 'block' | 'delete'; contact: Contact }

export function ContactDirectory() {
  const { t, i18n } = useTranslation()
  const { workspace, me } = useMe()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const query = useQuery(contactsQuery(workspace.id, search))
  const { client, pending, run } = useBetterAuthAction()
  const [form, setForm] = useState<'new' | Contact | null>(null)
  const [confirming, setConfirming] = useState<Confirmation | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const heading = useRef<HTMLHeadingElement>(null)
  const canManage = canManageContacts(me.role)
  const rows = query.data?.data ?? []
  const metadata = query.data?.metadata

  useEffect(() => {
    if (metadata && search.page > Math.max(1, metadata.lastPage)) {
      void navigate({ search: { ...search, page: Math.max(1, metadata.lastPage) }, replace: true })
    }
  }, [metadata, navigate, search])

  function name(contact: Contact) {
    return contactName(contact) ?? t('contacts.unnamed', { digits: contact.waId.slice(-4) })
  }

  function toggleDetails(id: number) {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function confirmAction() {
    if (!confirming || pending) return
    const { contact, kind } = confirming
    void run(
      async () => {
        if (kind === 'delete') await deleteApiV1WorkspaceContactsContactId(String(contact.id))
        else await patchApiV1WorkspaceContactsContactId(String(contact.id), { status: 'blocked' })
        setConfirming(null)
        if (kind === 'delete')
          void client.invalidateQueries({ queryKey: searchKeys.all(workspace.id) })
        if (
          rows.length === 1 &&
          search.page > 1 &&
          (kind === 'delete' || search.status === 'active')
        ) {
          await navigate({ search: { ...search, page: search.page - 1 }, replace: true })
        }
        await client.invalidateQueries({ queryKey: contactsKey(workspace.id) })
      },
      {
        notice: kind === 'delete' ? 'contacts.notices.deleted' : 'contacts.notices.blocked',
        values: { name: name(contact) },
      }
    )
  }

  return (
    <div className="contacts-page page-stack">
      <div className="contacts-page-heading">
        <div>
          <p className="eyebrow">{t('contacts.eyebrow')}</p>
          <PageHeader title={t('contacts.title')} description={t('contacts.description')} />
        </div>
        {canManage && <Button onClick={() => setForm('new')}>{t('contacts.actions.add')}</Button>}
      </div>
      <Card className="contacts-directory">
        <CardHeader>
          <CardTitle>
            <h2 ref={heading} tabIndex={-1}>
              {t('contacts.directory.title')}
            </h2>
          </CardTitle>
          <CardDescription>
            {metadata
              ? t(
                  search.status ? 'contacts.directory.filtered-count' : 'contacts.directory.count',
                  { count: metadata.total }
                )
              : t('contacts.directory.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="contacts-toolbar">
            <div className="contact-filters" role="group" aria-label={t('contacts.filters.label')}>
              <Button
                variant={!search.status ? 'secondary' : 'ghost'}
                aria-pressed={!search.status}
                onClick={() => void navigate({ search: { page: 1 } })}
              >
                {t('contacts.filters.all')}
              </Button>
              {contactStatuses.map((status) => (
                <Button
                  key={status}
                  variant={search.status === status ? 'secondary' : 'ghost'}
                  aria-pressed={search.status === status}
                  onClick={() => void navigate({ search: { status, page: 1 } })}
                >
                  {t('contacts.status.' + status)}
                </Button>
              ))}
            </div>
            <span className="contacts-privacy">{t('contacts.directory.privacy')}</span>
          </div>
          {query.isError && (
            <div className="contacts-load-error" role="alert">
              <div>
                <strong>{t('contacts.error.title')}</strong>
                <p>{t('contacts.error.description')}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                {t('contacts.actions.retry')}
              </Button>
            </div>
          )}
          {query.isPending ? (
            <div className="contacts-empty" role="status">
              <Spinner />
              <p>{t('contacts.loading')}</p>
            </div>
          ) : query.data && rows.length === 0 ? (
            <div className="contacts-empty">
              <h3>{t(search.status ? 'contacts.empty.filtered-title' : 'contacts.empty.title')}</h3>
              <p>
                {t(
                  search.status
                    ? 'contacts.empty.filtered-description'
                    : 'contacts.empty.description'
                )}
              </p>
              {search.status ? (
                <Button variant="outline" onClick={() => void navigate({ search: { page: 1 } })}>
                  {t('contacts.filters.all')}
                </Button>
              ) : (
                canManage && (
                  <Button onClick={() => setForm('new')}>{t('contacts.actions.add')}</Button>
                )
              )}
            </div>
          ) : (
            query.data && (
              <div className="contacts-table-wrap" aria-busy={query.isFetching}>
                <table className="contacts-table">
                  <thead>
                    <tr>
                      {['contact', 'status', 'searches', 'last-search', 'actions'].map((column) => (
                        <th scope="col" key={column}>
                          {t('contacts.columns.' + column)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((contact) => {
                      const displayName = name(contact)
                      const open = expanded.has(contact.id)
                      const lastSearch = formatContactDate(contact.lastLookupAt, i18n.language)
                      return (
                        <Fragment key={contact.id}>
                          <tr className={open ? 'contact-row-expanded' : ''}>
                            <td data-label={t('contacts.columns.contact')}>
                              <div className="contact-person">
                                <span className="contact-avatar" aria-hidden>
                                  {displayName.trim().slice(0, 1).toUpperCase()}
                                </span>
                                <div>
                                  <strong>{displayName}</strong>
                                  <span>
                                    {contact.profileName && contact.profileName !== displayName
                                      ? contact.profileName
                                      : t('contacts.whatsapp-contact')}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td data-label={t('contacts.columns.status')}>
                              <span className={'contact-status contact-status-' + contact.status}>
                                {t('contacts.status.' + contact.status)}
                              </span>
                            </td>
                            <td data-label={t('contacts.columns.searches')}>
                              <div className="contact-search-counts">
                                <span>
                                  <strong>
                                    {contact.lookupsCount.toLocaleString(i18n.language)}
                                  </strong>
                                  <small>{t('contacts.total')}</small>
                                </span>
                                <span>
                                  <strong>
                                    {contact.monthLookupsCount.toLocaleString(i18n.language)}
                                  </strong>
                                  <small>{t('contacts.month')}</small>
                                </span>
                              </div>
                            </td>
                            <td data-label={t('contacts.columns.last-search')}>
                              {lastSearch ? (
                                <time dateTime={contact.lastLookupAt ?? undefined}>
                                  {lastSearch}
                                </time>
                              ) : (
                                <span className="contacts-muted">{t('contacts.never')}</span>
                              )}
                            </td>
                            <td data-label={t('contacts.columns.actions')}>
                              <div className="contact-actions">
                                <Button
                                  variant="link"
                                  aria-expanded={open}
                                  aria-controls={'contact-details-' + contact.id}
                                  aria-label={t(
                                    open
                                      ? 'contacts.actions.hide-for'
                                      : 'contacts.actions.view-for',
                                    { name: displayName }
                                  )}
                                  onClick={() => toggleDetails(contact.id)}
                                >
                                  {t(open ? 'contacts.actions.hide' : 'contacts.actions.view')}
                                </Button>
                                {canManage && (
                                  <>
                                    <Button
                                      variant="link"
                                      disabled={pending}
                                      aria-label={t('contacts.actions.edit-for', {
                                        name: displayName,
                                      })}
                                      onClick={() => setForm(contact)}
                                    >
                                      {t('contacts.actions.edit')}
                                    </Button>
                                    {contact.status === 'active' ? (
                                      <Button
                                        variant="link"
                                        disabled={pending}
                                        aria-label={t('contacts.actions.block-for', {
                                          name: displayName,
                                        })}
                                        onClick={() => setConfirming({ kind: 'block', contact })}
                                      >
                                        {t('contacts.actions.block')}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="link"
                                        disabled={pending}
                                        aria-label={t('contacts.actions.unblock-for', {
                                          name: displayName,
                                        })}
                                        onClick={() =>
                                          void run(
                                            async () => {
                                              await patchApiV1WorkspaceContactsContactId(
                                                String(contact.id),
                                                { status: 'active' }
                                              )
                                              if (
                                                rows.length === 1 &&
                                                search.page > 1 &&
                                                search.status === 'blocked'
                                              )
                                                await navigate({
                                                  search: { ...search, page: search.page - 1 },
                                                  replace: true,
                                                })
                                              await client.invalidateQueries({
                                                queryKey: contactsKey(workspace.id),
                                              })
                                            },
                                            {
                                              notice: 'contacts.notices.unblocked',
                                              values: { name: displayName },
                                            }
                                          )
                                        }
                                      >
                                        {t('contacts.actions.unblock')}
                                      </Button>
                                    )}
                                    <Button
                                      variant="link"
                                      className="contact-delete"
                                      disabled={pending}
                                      aria-label={t('contacts.actions.delete-for', {
                                        name: displayName,
                                      })}
                                      onClick={() => setConfirming({ kind: 'delete', contact })}
                                    >
                                      {t('contacts.actions.delete')}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {open && (
                            <tr id={'contact-details-' + contact.id} className="contact-detail-row">
                              <td colSpan={5}>
                                <dl>
                                  <div>
                                    <dt>{t('contacts.details.phone')}</dt>
                                    <dd dir="ltr">+{contact.waId}</dd>
                                  </div>
                                  <div>
                                    <dt>{t('contacts.details.channel')}</dt>
                                    <dd>WhatsApp</dd>
                                  </div>
                                  <div>
                                    <dt>{t('contacts.details.joined')}</dt>
                                    <dd>
                                      {formatContactDate(contact.createdAt, i18n.language) ?? '—'}
                                    </dd>
                                  </div>
                                </dl>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
          {metadata && metadata.lastPage > 1 && (
            <nav className="contacts-pagination" aria-label={t('contacts.pagination.label')}>
              <span>
                {t('contacts.pagination.page', {
                  page: metadata.currentPage,
                  pages: metadata.lastPage,
                })}
              </span>
              <div>
                <Button
                  variant="outline"
                  disabled={query.isFetching || metadata.currentPage <= 1}
                  onClick={() =>
                    void navigate({ search: { ...search, page: metadata.currentPage - 1 } })
                  }
                >
                  {t('contacts.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  disabled={query.isFetching || metadata.currentPage >= metadata.lastPage}
                  onClick={() =>
                    void navigate({ search: { ...search, page: metadata.currentPage + 1 } })
                  }
                >
                  {t('contacts.pagination.next')}
                </Button>
              </div>
            </nav>
          )}
        </CardContent>
      </Card>
      <aside className="contacts-info">
        <img src="/images/workspace-info.svg" alt="" width="20" height="20" />
        <div>
          <strong>{t('contacts.safety.title')}</strong>
          <p>{t(canManage ? 'contacts.safety.description' : 'contacts.safety.viewer')}</p>
        </div>
      </aside>
      {form && (
        <ContactFormDialog
          key={form === 'new' ? 'new' : form.id}
          workspaceId={workspace.id}
          contact={form === 'new' ? undefined : form}
          onClose={() => setForm(null)}
        />
      )}
      <ConfirmDialog
        open={!!confirming}
        title={
          confirming
            ? t('contacts.confirm.' + confirming.kind + '.title', {
                name: name(confirming.contact),
              })
            : ''
        }
        description={
          confirming
            ? t('contacts.confirm.' + confirming.kind + '.description', {
                name: name(confirming.contact),
              })
            : ''
        }
        action={confirming ? t('contacts.confirm.' + confirming.kind + '.action') : ''}
        pending={pending}
        onConfirm={confirmAction}
        onClose={() => {
          if (!pending) setConfirming(null)
        }}
        returnTo={heading}
      />
    </div>
  )
}
