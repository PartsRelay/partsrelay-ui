import { useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fieldErrors } from '@/core/errors'
import { useAppForm } from '@/form'
import {
  emptyLookup,
  lookupFieldErrors,
  newLookup,
  plateError,
  QUERY_LENGTH,
  queryError,
} from '@/modules/lookups/core/lookup-form'
import { useStartLookup } from '@/modules/lookups/ui/hooks/use-start-lookup'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Callout } from '@/ui/components/callout'
import { Button } from '@/ui/components/ui/button'
import { FieldGroup } from '@/ui/components/ui/field'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/ui/sheet'

type NewLookupSheetProps = { open: boolean; plate?: string; onClose: () => void }

export function NewLookupSheet({ open, plate, onClose }: NewLookupSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <NewLookupForm plate={plate} />
      </SheetContent>
    </Sheet>
  )
}

function NewLookupForm({ plate }: { plate?: string }) {
  const { t } = useTranslation()
  const { me } = useMe()
  const navigate = useNavigate()
  const start = useStartLookup()
  const form = useAppForm({
    defaultValues: emptyLookup(plate),
    onSubmit: async ({ value, formApi }) => {
      try {
        const { id } = await start.mutateAsync(newLookup(value))
        await navigate({
          to: '/searches/$lookupId',
          params: { lookupId: String(id) },
          replace: true,
        })
      } catch (error) {
        const fields = fieldErrors(error, lookupFieldErrors)
        if (fields) formApi.setErrorMap({ onSubmit: { fields } })
      }
    },
  })

  return (
    <form.AppForm>
      <form.Form className="flex min-h-full flex-col">
        <SheetHeader className="gap-2 p-6 pr-12">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            {t('lookups.new.eyebrow')}
          </p>
          <SheetTitle className="text-2xl font-semibold">{t('lookups.new.title')}</SheetTitle>
          <SheetDescription>{t('lookups.new.description')}</SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 px-6 pb-6">
          <FieldGroup>
            <form.AppField name="plate" validators={{ onSubmit: plateError }}>
              {(field) => (
                <field.InputField
                  label={t('lookups.new.plate')}
                  required
                  description={t('lookups.new.plate-hint')}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder={t('lookups.new.plate-placeholder')}
                  className="uppercase placeholder:normal-case"
                />
              )}
            </form.AppField>
            <form.AppField name="query" validators={{ onSubmit: queryError }}>
              {(field) => (
                <field.InputField
                  label={t('lookups.new.query')}
                  required
                  description={t('lookups.new.query-hint')}
                  autoComplete="off"
                  maxLength={QUERY_LENGTH.max}
                  placeholder={t('lookups.new.query-placeholder')}
                />
              )}
            </form.AppField>
          </FieldGroup>
          <Callout title={t('lookups.new.tips.title')}>{t('lookups.new.tips.body')}</Callout>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p>{t('lookups.new.requester', { name: me.member.name })}</p>
            <p>{t('lookups.fitment')}</p>
          </div>
        </div>
        <SheetFooter className="flex-row justify-end border-t p-6">
          <SheetClose asChild>
            <Button variant="outline">{t('confirm.cancel')}</Button>
          </SheetClose>
          <form.SubmitButton>
            {t('lookups.new.submit')}
            <ArrowRightIcon data-icon="inline-end" />
          </form.SubmitButton>
        </SheetFooter>
      </form.Form>
    </form.AppForm>
  )
}
