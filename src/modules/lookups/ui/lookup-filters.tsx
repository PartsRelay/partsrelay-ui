import { useTranslation } from 'react-i18next'
import { ALL, type FilterOption, filterOptions, filterValues } from '@/modules/lookups/core/lookups'
import { useLookupFilters } from '@/modules/lookups/ui/hooks/use-lookup-filters'
import { RequesterFilter } from '@/modules/lookups/ui/requester-filter'
import { FilterSelect } from '@/ui/components/filter-select'
import { SearchField } from '@/ui/components/search-field'

export function LookupFilters({ requester }: { requester?: string }) {
  const { t } = useTranslation()
  const { search, change } = useLookupFilters()
  const options = (items: FilterOption[]) =>
    items.map(({ value, label }) => ({ value, label: t(...label) }))

  return (
    <div className="grid gap-4">
      <SearchField
        label={t('lookups.filter.search')}
        placeholder={t('lookups.filter.search-placeholder')}
        value={search.search}
        className="sm:max-w-xs"
        onSearch={(value) => change({ search: value })}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label={t('lookups.filter.status')}
          value={search.status ?? ALL}
          options={options(filterOptions.status)}
          onValueChange={(value) => change({ status: filterValues.status(value) })}
        />
        <FilterSelect
          label={t('lookups.filter.period')}
          value={search.days ? String(search.days) : ALL}
          options={options(filterOptions.days)}
          onValueChange={(value) => change({ days: filterValues.days(value) })}
        />
        <FilterSelect
          label={t('lookups.filter.channel')}
          value={search.source ?? ALL}
          options={options(filterOptions.source)}
          onValueChange={(value) => change({ source: filterValues.source(value) })}
        />
        <RequesterFilter selected={requester} />
      </div>
    </div>
  )
}
