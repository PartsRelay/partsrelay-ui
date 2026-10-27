import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import type { OemPart } from '@/core/api/models'
import type { CategoryView, UnitView } from '@/modules/lookups/core/lookup-detail'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { Skeleton } from '@/ui/components/ui/skeleton'

function Part({ part }: { part: OemPart }) {
  const { t } = useTranslation()

  return (
    <li className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 bg-muted/50 px-3 py-2.5">
        <span className="font-heading font-bold tracking-wide">
          {t('lookups.results.original-code', { code: part.code })}
        </span>
        {part.name && <span className="text-muted-foreground">{part.name}</span>}
      </div>
      {part.aftermarket.length > 0 ? (
        <ul className="divide-y border-t">
          {part.aftermarket.map((match, index) => (
            <li
              key={`${match.code}:${index}`}
              className="grid gap-0.5 px-3 py-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
            >
              <span className="flex flex-wrap gap-x-2">
                <span className="font-semibold">{match.brand}</span>
                <span className="tracking-wide">{match.code}</span>
              </span>
              {match.description && (
                <span className="text-muted-foreground">{match.description}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t px-3 py-2.5 text-muted-foreground">
          {t('lookups.results.no-aftermarket')}
        </p>
      )}
    </li>
  )
}

function Unit({ unit, category }: { unit: UnitView; category: string }) {
  const { t } = useTranslation()
  const name = unit.name ?? (unit.code && t('lookups.results.unit', { code: unit.code }))

  return (
    <section
      className={cn('grid gap-4', unit.imageUrl && 'md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6')}
    >
      {unit.imageUrl && (
        <a
          href={unit.imageUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-auto block w-full max-w-72 self-start rounded-lg md:max-w-none"
        >
          <img
            src={unit.imageUrl}
            alt={t('lookups.results.image', { name: name || category })}
            loading="lazy"
            className="aspect-square w-full rounded-lg border bg-white object-contain p-2 transition-shadow hover:shadow-md"
          />
        </a>
      )}
      <div className="grid content-start gap-3">
        {name && <h3 className="font-heading font-semibold">{name}</h3>}
        {unit.parts.length > 0 ? (
          <ul className="grid gap-3">
            {unit.parts.map((part, index) => (
              <Part key={`${part.code}:${index}`} part={part} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">{t('lookups.results.no-parts')}</p>
        )}
      </div>
    </section>
  )
}

export function LookupResultsSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="mx-auto aspect-square w-full max-w-72 md:max-w-none" />
        <div className="grid content-start gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-36 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export function LookupResults({ categories }: { categories: CategoryView[] }) {
  const { t } = useTranslation()

  return categories.map((category) => (
    <Card key={category.id}>
      <CardHeader>
        <CardHeading>{category.name}</CardHeading>
        <CardDescription>
          {[
            t('lookups.results.original', { count: category.counts.original }),
            t('lookups.results.aftermarket', { count: category.counts.aftermarket }),
          ].join(' · ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 [&>section+section]:border-t [&>section+section]:pt-6">
        {category.units.map((unit) => (
          <Unit key={unit.key} unit={unit} category={category.name} />
        ))}
      </CardContent>
    </Card>
  ))
}
