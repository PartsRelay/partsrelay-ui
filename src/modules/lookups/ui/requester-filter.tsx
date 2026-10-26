import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MAX_PER_PAGE } from '@/core/pagination'
import { contactsQuery } from '@/modules/contacts/core/contacts.query'
import {
  EVERYONE,
  type RequesterOption,
  requesterOptions,
  requesterSearch,
  requesterValue,
} from '@/modules/lookups/core/lookups'
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

const route = getRouteApi('/_app/(lookups)/searches/')

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
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const contacts = useQuery(contactsQuery({ page: 1, perPage: MAX_PER_PAGE }))
  const options = requesterOptions(workspace, contacts.data?.data ?? [])
  const value = requesterValue(search)
  const known = [...options.members, ...options.contacts].some((option) => option.value === value)

  return (
    <Select
      value={value}
      onValueChange={(next) => void navigate({ search: requesterSearch(next) })}
    >
      <TextField label={t('lookups.filter.label')} className="sm:max-w-xs">
        <SelectTrigger className="w-full min-w-0 *:data-[slot=select-value]:min-w-0">
          <SelectValue />
        </SelectTrigger>
      </TextField>
      <SelectContent className="max-w-[calc(100vw-2rem)]">
        <SelectItem value={EVERYONE}>{t('lookups.filter.everyone')}</SelectItem>
        {value !== EVERYONE && !known && (
          <SelectItem value={value}>{selected ?? t('lookups.filter.selected')}</SelectItem>
        )}
        <OptionGroup label={t('lookups.filter.members')} options={options.members} />
        <OptionGroup label={t('lookups.filter.contacts')} options={options.contacts} />
      </SelectContent>
    </Select>
  )
}
