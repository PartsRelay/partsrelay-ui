import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/core/errors'
import { requesterName, visibleSearches } from '@/modules/searches/core/search'
import { searchesQuery } from '@/modules/searches/core/searches.query'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { NewSearch } from '@/modules/searches/ui/new-search'
import { SearchStatus } from '@/modules/searches/ui/search-status'
import { Button } from '@/ui/components/ui/button'
import { Input } from '@/ui/components/ui/input'
import { Skeleton } from '@/ui/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/ui/components/ui/table'
import '@/modules/searches/ui/searches.css'

const route = getRouteApi('/_app/searches/')
export function SearchesPage() {
  const { t, i18n } = useTranslation()
  const { workspace, me } = useMe()
  const filters = route.useSearch()
  const navigate = route.useNavigate()
  const list = useQuery(searchesQuery(workspace.id, filters))
  const [text, setText] = useState('')
  const deferredText = useDeferredValue(text)
  const [status, setStatus] = useState('all')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const searches = list.data?.data ?? []
  const metadata = list.data?.metadata
  const visible = visibleSearches(searches, deferredText, status)
  const date = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value)
    )
  const counts = [
    metadata?.total,
    searches.filter((search) => search.status === 'done').length,
    searches.filter((search) => search.status === 'running').length,
    searches.filter((search) => !['running', 'done'].includes(search.status)).length,
  ]
  const filterChanged = (requester: 'all' | 'user' | 'contact') => {
    setText('')
    setStatus('all')
    void navigate({ search: { page: 1, requester } })
  }
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('searches.eyebrow')}</p>
          <h1>{t('searches.greeting', { name: me.member.name.split(' ')[0] })}</h1>
          <p className="page-description">{t('searches.description')}</p>
        </div>
        <Button onClick={() => void navigate({ search: { ...filters, newSearch: true } })}>
          + {t('searches.new-button')}
        </Button>
      </div>
      <section className="search-metrics" aria-label={t('searches.metrics-label')}>
        {['saved', 'completed', 'running', 'attention'].map((name, index) => (
          <div className="panel metric" key={name}>
            <p className="eyebrow">{t(`searches.metrics.${name}`)}</p>
            {list.isPending ? (
              <Skeleton className="h-9 w-14" />
            ) : (
              <strong>{list.isError ? '—' : (counts[index] ?? 0)}</strong>
            )}
            <p>{t(index === 0 ? 'searches.current-filter' : 'searches.current-page')}</p>
          </div>
        ))}
      </section>
      <section className="search-overview">
        <div className="panel">
          <h2>{t('searches.channels-title')}</h2>
          <p>{t('searches.channels-body')}</p>
          <div className="channel-pills">
            <span>Web</span>
            <span>WhatsApp</span>
          </div>
          <p className="muted">{t('searches.channel-note')}</p>
        </div>
        <div className="panel">
          <h2>{t('searches.desk-title')}</h2>
          <p>{t('searches.desk-body')}</p>
          <div className="desk-summary">
            <strong>{workspace.name}</strong>
            <span>{t('searches.member-count', { count: workspace.members.length })}</span>
          </div>
          {me.permissions.viewTeam && (
            <Link to="/workspace" className="text-link">
              {t('searches.manage-team')} →
            </Link>
          )}
        </div>
      </section>
      <section className="panel search-queue" aria-labelledby="queue-heading">
        <div>
          <h2 id="queue-heading">{t('searches.queue')}</h2>
          <p className="muted">{t('searches.queue-description')}</p>
        </div>
        <div className="queue-toolbar">
          <Input
            aria-label={t('searches.filter-page')}
            placeholder={t('searches.filter-page')}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="view-switch" aria-label={t('searches.view')}>
            <Button
              size="sm"
              variant={view === 'table' ? 'default' : 'ghost'}
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
            >
              {t('searches.table')}
            </Button>
            <Button
              size="sm"
              variant={view === 'cards' ? 'default' : 'ghost'}
              aria-pressed={view === 'cards'}
              onClick={() => setView('cards')}
            >
              {t('searches.cards')}
            </Button>
          </div>
        </div>
        <div className="queue-filters">
          <label>
            {t('searches.requesters')}
            <select
              value={filters.requester}
              onChange={(event) => filterChanged(event.target.value as 'all' | 'user' | 'contact')}
            >
              <option value="all">{t('searches.everyone')}</option>
              <option value="user">{t('searches.team')}</option>
              <option value="contact">{t('searches.workshops')}</option>
            </select>
          </label>
          {filters.requester === 'user' && (
            <label>
              {t('searches.person')}
              <select
                value={filters.person ?? ''}
                onChange={(event) =>
                  void navigate({
                    search: {
                      ...filters,
                      page: 1,
                      person: event.target.value ? Number(event.target.value) : undefined,
                    },
                  })
                }
              >
                <option value="">{t('searches.everyone')}</option>
                {workspace.members.map((member) => (
                  <option key={member.id} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            {t('searches.status-on-page')}
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">{t('searches.all-statuses')}</option>
              {['done', 'running', 'vehicle_not_found', 'not_matched', 'failed'].map((state) => (
                <option key={state} value={state}>
                  {t(`searches.status.${state}`)}
                </option>
              ))}
            </select>
          </label>
          <Button variant="ghost" onClick={() => void list.refetch()} disabled={list.isFetching}>
            {list.isFetching ? t('searches.refreshing') : t('searches.refresh')}
          </Button>
        </div>
        {list.isPending ? (
          <div className="grid gap-3" aria-label={t('searches.loading')}>
            {[1, 2, 3].map((id) => (
              <Skeleton key={id} className="h-16 w-full" />
            ))}
          </div>
        ) : list.isError ? (
          <div className="empty-searches" role="alert">
            <h3>{t('searches.load-error')}</h3>
            <p>{t(...errorMessage(list.error))}</p>
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t('searches.retry')}
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-searches">
            <h3>{t(searches.length ? 'searches.no-matches' : 'searches.empty-title')}</h3>
            <p>{t(searches.length ? 'searches.no-matches-body' : 'searches.empty-body')}</p>
            {!searches.length && (
              <Button onClick={() => void navigate({ search: { ...filters, newSearch: true } })}>
                {t('searches.new-button')}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={view === 'table' ? 'search-table' : 'hidden'}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {['plate', 'vehicle', 'status', 'channel', 'requester', 'requested'].map(
                      (column) => (
                        <TableHead key={column}>{t(`searches.columns.${column}`)}</TableHead>
                      )
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((search) => (
                    <TableRow key={search.id}>
                      <TableCell>
                        <Link
                          className="plate-link"
                          to="/searches/$searchId"
                          params={{ searchId: String(search.id) }}
                        >
                          {search.plate}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p>
                          {search.vehicleDescription ||
                            t(
                              search.status === 'running'
                                ? 'searches.identifying'
                                : 'searches.vehicle-unknown'
                            )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <SearchStatus status={search.status} />
                      </TableCell>
                      <TableCell>{search.source === 'whatsapp' ? 'WhatsApp' : 'Web'}</TableCell>
                      <TableCell>
                        {requesterName(search, workspace.members, t('searches.former-requester'))}
                      </TableCell>
                      <TableCell>
                        <time dateTime={search.createdAt}>{date(search.createdAt)}</time>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className={view === 'cards' ? 'search-cards' : 'search-cards mobile-cards'}>
              {visible.map((search) => (
                <Link
                  className="search-card"
                  key={search.id}
                  to="/searches/$searchId"
                  params={{ searchId: String(search.id) }}
                >
                  <div>
                    <strong>{search.plate}</strong>
                    <SearchStatus status={search.status} />
                  </div>
                  <p>
                    {search.vehicleDescription ||
                      t(
                        search.status === 'running'
                          ? 'searches.identifying'
                          : 'searches.vehicle-unknown'
                      )}
                  </p>
                  <small>
                    {requesterName(search, workspace.members, t('searches.former-requester'))} ·{' '}
                    {search.source === 'whatsapp' ? 'WhatsApp' : 'Web'}
                  </small>
                  <time dateTime={search.createdAt}>{date(search.createdAt)}</time>
                </Link>
              ))}
            </div>
          </>
        )}
        {metadata && (
          <div className="queue-pagination">
            <p className="muted">
              {t('searches.showing', { count: visible.length, total: metadata.total })}
              {(text || status !== 'all') && <span> · {t('searches.filtered-page')}</span>}
            </p>
            <div>
              <Button
                variant="outline"
                disabled={filters.page <= 1 || list.isFetching}
                onClick={() => void navigate({ search: { ...filters, page: filters.page - 1 } })}
              >
                {t('searches.previous')}
              </Button>
              <span>
                {t('searches.page', {
                  page: metadata.currentPage,
                  total: Math.max(1, metadata.lastPage),
                })}
              </span>
              <Button
                disabled={metadata.currentPage >= metadata.lastPage || list.isFetching}
                onClick={() => void navigate({ search: { ...filters, page: filters.page + 1 } })}
              >
                {t('searches.next')}
              </Button>
            </div>
          </div>
        )}
      </section>
      <NewSearch
        open={Boolean(filters.newSearch)}
        onOpenChange={(newSearch) =>
          void navigate({
            search: { ...filters, newSearch: newSearch || undefined },
            replace: true,
          })
        }
      />
    </div>
  )
}
