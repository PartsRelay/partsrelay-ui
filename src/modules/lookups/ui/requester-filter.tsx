import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { OPTIONS_PER_PAGE } from '@/core/pagination'
import { contactsQuery } from '@/modules/contacts/core/contacts.query'
import {
  EVERYONE,
  type RequesterOption,
  requesterOptions,
  requesterSearch,
  requesterValue,
} from '@/modules/lookups/core/lookups'
import { useLookupFilters } from '@/modules/lookups/ui/hooks/use-lookup-filters'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { TextField } from '@/ui/components/text-field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/ui/select'

function OptionGroup({ label, options }: { label: string; options: RequesterOption[] }) {
  if (options.length === 0) return null

  return (
    <SelectGroup>
      <SelectLabel>{label}</SelectLabel>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectGroup>
  )
}

export function RequesterFilter({ selected }: { selected?: string }) {
  const { t } = useTranslation()
  const { workspace } = useMe()
  const { search, change } = useLookupFilters()
  const contacts = useQuery(contactsQuery({ perPage: OPTIONS_PER_PAGE }))
  const options = requesterOptions(workspace, contacts.data?.data ?? [])
  const value = requesterValue(search)
  const known = [...options.members, ...options.contacts].some((option) => option.value === value)

  return (
    <Select value={value} onValueChange={(next) => change(requesterSearch(next))}>
      <TextField label={t('lookups.filter.label')}>
        <SelectTrigger className="w-full min-w-0 *:data-[slot=select-value]:min-w-0">
          <SelectValue />
        </SelectTrigger>
      </TextField>
      <SelectContent className="max-w-[calc(100vw-2rem)]">
        <SelectGroup>
          <SelectItem value={EVERYONE}>{t('lookups.filter.everyone')}</SelectItem>
          {value !== EVERYONE && !known && (
            <SelectItem value={value}>{selected ?? t('lookups.filter.selected')}</SelectItem>
          )}
        </SelectGroup>
        <OptionGroup label={t('lookups.filter.members')} options={options.members} />
        <OptionGroup label={t('lookups.filter.contacts')} options={options.contacts} />
      </SelectContent>
    </Select>
  )
}
