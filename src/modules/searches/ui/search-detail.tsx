import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/core/errors'
import { requesterName, searchState } from '@/modules/searches/core/search'
import { searchQuery } from '@/modules/searches/core/searches.query'
import { SearchStatus } from '@/modules/searches/ui/search-status'
import { NewSearch } from '@/modules/searches/ui/new-search'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Button } from '@/ui/components/ui/button'
import { Skeleton } from '@/ui/components/ui/skeleton'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/ui/components/ui/table'
import { Spinner } from '@/ui/components/ui/spinner'
import '@/modules/searches/ui/searches.css'

const route = getRouteApi('/_app/searches/$searchId')
export function SearchDetailPage() {
  const { t, i18n } = useTranslation()
  const { workspace } = useMe()
  const { searchId } = route.useParams()
  const detail = useQuery(searchQuery(workspace.id, Number(searchId)))
  const [open, setOpen] = useState(false)
  const search = detail.data
  const state = search ? searchState(search) : null
  const categories = search?.categories ?? []
  const parts = categories.flatMap((category) => category.units.flatMap((unit) => unit.original))
  const aftermarket = parts.flatMap((part) =>
    part.aftermarket.map((match) => ({ ...match, originalCode: part.code }))
  )
  const first = parts[0]
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('searches.result-eyebrow')}</p>
          <h1>
            {categories
              .map((category) => category.name)
              .filter(Boolean)
              .join(' · ') || t('searches.result-title')}
          </h1>
          <p className="page-description">{t('searches.result-description')}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/searches" search={{ page: 1, requester: 'all' }}>
            ← {t('searches.back')}
          </Link>
        </Button>
      </div>
      {detail.isPending ? (
        <Skeleton className="h-72 w-full" />
      ) : detail.isError ? (
        <div className="panel empty-searches" role="alert">
          <h2>{t('searches.load-error')}</h2>
          <p>{t(...errorMessage(detail.error))}</p>
          <Button onClick={() => void detail.refetch()}>{t('searches.retry')}</Button>
        </div>
      ) : (
        search && (
          <>
            <section className="result-overview">
              <div className="vehicle-card">
                <div className="flex justify-between items-center gap-4">
                  <strong className="vehicle-plate">{search.plate}</strong>
                  <SearchStatus status={search.status} />
                </div>
                <h2>
                  {search.vehicleDescription ||
                    t(
                      search.status === 'running'
                        ? 'searches.identifying'
                        : 'searches.vehicle-unknown'
                    )}
                </h2>
                {search.vin && <p className="vehicle-vin">VIN {search.vin}</p>}
                <dl>
                  <div>
                    <dt>{t('searches.columns.requester')}</dt>
                    <dd>
                      {requesterName(search, workspace.members, t('searches.former-requester'))}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('searches.columns.channel')}</dt>
                    <dd>{search.source === 'whatsapp' ? 'WhatsApp' : 'Web'}</dd>
                  </div>
                  <div>
                    <dt>{t('searches.columns.requested')}</dt>
                    <dd>
                      {new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(search.createdAt))}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="panel original-summary">
                <h2>{t('searches.original-title')}</h2>
                {first ? (
                  <>
                    <strong className="part-reference">{first.code}</strong>
                    <p>{first.name}</p>
                    <p className="muted">
                      {t('searches.reference-count', { count: parts.length })}
                    </p>
                  </>
                ) : (
                  <p className="muted">
                    {t(
                      search.status === 'running'
                        ? 'searches.awaiting-results'
                        : 'searches.no-references'
                    )}
                  </p>
                )}
                <p className="muted">{t('searches.fitment')}</p>
              </div>
            </section>
            <div className="info-banner" role="status">
              {search.status === 'running' ? <Spinner /> : <img src="/brand/info.svg" alt="" />}
              <div>
                <strong>{t(`searches.outcome.${state}.title`)}</strong>
                <p>{t(`searches.outcome.${state}.body`)}</p>
                {state !== 'running' && state !== 'results' && (
                  <Button className="mt-3" variant="outline" onClick={() => setOpen(true)}>
                    {t('searches.new-button')}
                  </Button>
                )}
              </div>
            </div>
            {state === 'results' && (
              <>
                <section className="panel result-matches">
                  <h2>{t('searches.aftermarket-title')}</h2>
                  <p className="muted">
                    {t('searches.match-count', { count: aftermarket.length })}
                  </p>
                  {aftermarket.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {['brand', 'reference', 'description', 'original'].map((name) => (
                            <TableHead key={name}>{t(`searches.parts.${name}`)}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aftermarket.map((part, index) => (
                          <TableRow key={`${part.code}-${index}`}>
                            <TableCell>{part.brand || '—'}</TableCell>
                            <TableCell>
                              <strong>{part.code}</strong>
                            </TableCell>
                            <TableCell>{part.description || '—'}</TableCell>
                            <TableCell>{part.originalCode}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>{t('searches.no-aftermarket')}</p>
                  )}
                </section>
                {categories.map((category) => (
                  <section className="panel category-panel" key={category.id}>
                    <h2>{category.name || t('searches.original-title')}</h2>
                    {category.units.map((unit, index) => (
                      <div className="catalog-unit" key={`${category.id}-${index}`}>
                        <div>
                          <h3>{unit.name || t('searches.catalogue')}</h3>
                          {unit.code && <p className="muted">{unit.code}</p>}
                          {unit.imageUrl && (
                            <img
                              className="catalog-diagram"
                              src={unit.imageUrl}
                              alt={unit.name || t('searches.diagram')}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                        <div className="original-parts">
                          {unit.original.map((part, partIndex) => (
                            <div className="original-part" key={`${part.code}-${partIndex}`}>
                              <span className="eyebrow">OE</span>
                              <strong>{part.code}</strong>
                              <p>{part.name || t('searches.original-title')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </section>
                ))}
              </>
            )}
            <section className="panel request-record">
              <h2>{t('searches.request-record')}</h2>
              <dl>
                <div>
                  <dt>{t('searches.columns.plate')}</dt>
                  <dd>{search.plate}</dd>
                </div>
                <div>
                  <dt>{t('design.workspace')}</dt>
                  <dd>{workspace.name}</dd>
                </div>
              </dl>
              <p className="muted">{t('searches.company-history')}</p>
            </section>
          </>
        )
      )}
      <NewSearch open={open} onOpenChange={setOpen} />
    </div>
  )
}
