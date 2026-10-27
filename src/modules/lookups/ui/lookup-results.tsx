import { cn } from 'cn'
import { useTranslation } from 'react-i18next'
import type { OemPart } from '@/core/api/models'
import type { CategoryView, UnitView } from '@/modules/lookups/core/lookup-detail'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/ui/components/ui/item'

function Part({ part }: { part: OemPart }) {
  const { t } = useTranslation()

  return (
    <li className="grid gap-2">
      <Item variant="outline" size="sm">
        <ItemContent>
          <ItemTitle className="font-mono">
            {t('lookups.results.original-code', { code: part.code })}
          </ItemTitle>
          {part.name && <ItemDescription>{part.name}</ItemDescription>}
        </ItemContent>
      </Item>
      {part.aftermarket.length > 0 ? (
        <ul className="grid gap-1 pl-4">
          {part.aftermarket.map((match, index) => (
            <li key={`${match.code}:${index}`}>
              <Item variant="muted" size="xs">
                <ItemContent>
                  <ItemTitle>
                    {match.brand}
                    <span className="font-mono font-normal">{match.code}</span>
                  </ItemTitle>
                  {match.description && <ItemDescription>{match.description}</ItemDescription>}
                </ItemContent>
              </Item>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pl-4 text-sm text-muted-foreground">{t('lookups.results.no-aftermarket')}</p>
      )}
    </li>
  )
}

function Unit({ unit, category }: { unit: UnitView; category: string }) {
  const { t } = useTranslation()
  const name = unit.name ?? (unit.code && t('lookups.results.unit', { code: unit.code }))

  return (
    <section
      className={cn('grid gap-4', unit.imageUrl && 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}
    >
      {unit.imageUrl && (
        <a href={unit.imageUrl} target="_blank" rel="noreferrer">
          <img
            src={unit.imageUrl}
            alt={t('lookups.results.image', { name: name || category })}
            loading="lazy"
            className="aspect-square w-full rounded-lg border bg-white object-contain"
          />
        </a>
      )}
      <div className="grid content-start gap-3">
        {name && <h3 className="font-medium">{name}</h3>}
        {unit.parts.length > 0 ? (
          <ul className="grid gap-4">
            {unit.parts.map((part, index) => (
              <Part key={`${part.code}:${index}`} part={part} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('lookups.results.no-parts')}</p>
        )}
      </div>
    </section>
  )
}

export function LookupResults({ categories }: { categories: CategoryView[] }) {
  const { t } = useTranslation()

  return categories.map((category) => (
    <Card key={category.id}>
      <CardHeader>
        <CardTitle>
          <h2>{category.name}</h2>
        </CardTitle>
        <CardDescription>
          {[
            t('lookups.results.original', { count: category.counts.original }),
            t('lookups.results.aftermarket', { count: category.counts.aftermarket }),
          ].join(' · ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {category.units.map((unit) => (
          <Unit key={unit.key} unit={unit} category={category.name} />
        ))}
      </CardContent>
    </Card>
  ))
}
