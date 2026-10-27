import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  emptyLookup,
  identifierSchemas,
  identifiers,
  type LookupPrefill,
  lookupFieldErrors,
  newLookup,
  QUERY_LENGTH,
  querySchema,
  toIdentifier,
} from '@/modules/lookups/core/lookup-form'
import { useStartLookup } from '@/modules/lookups/ui/hooks/use-start-lookup'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Callout } from '@/ui/components/callout'
import { ChoiceGroup } from '@/ui/components/choice-group'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'
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
import { useReturnFocus } from '@/ui/hooks/use-return-focus'

type NewLookupSheetProps = { open: boolean; prefill: LookupPrefill; onClose: () => void }

export function NewLookupSheet({ open, prefill, onClose }: NewLookupSheetProps) {
  const returnFocus = useReturnFocus(open)

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        onCloseAutoFocus={returnFocus}
        className="gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <NewLookupForm prefill={prefill} />
      </SheetContent>
    </Sheet>
  )
}

function NewLookupForm({ prefill }: { prefill: LookupPrefill }) {
  const { t } = useTranslation()
  const { me } = useMe()
  const navigate = useNavigate()
  const start = useStartLookup()
  const form = useForm({
    defaultValues: emptyLookup(prefill),
    onSubmit: async ({ value, formApi }) => {
      try {
        const { id } = await start.mutateAsync(newLookup(value))
        await navigate({
          to: '/searches/$lookupId',
          params: { lookupId: String(id) },
          replace: true,
        })
      } catch (error) {
        const fields = lookupFieldErrors(error)
        if (fields) formApi.setErrorMap({ onSubmit: { fields } })
      }
    },
  })

  return (
    <Form form={form} className="flex min-h-full flex-col">
      <SheetHeader className="gap-2 p-6 pr-12">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          {t('lookups.new.eyebrow')}
        </p>
        <SheetTitle className="text-2xl font-semibold">{t('lookups.new.title')}</SheetTitle>
        <SheetDescription>{t('lookups.new.description')}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-6 px-6 pb-6">
        <FieldGroup>
          <form.Field name="by">
            {(field) => (
              <ChoiceGroup
                aria-label={t('lookups.new.identify')}
                options={identifiers.map((by) => ({ value: by, label: t(`lookups.new.by.${by}`) }))}
                value={field.state.value}
                onValueChange={(value) => {
                  const by = toIdentifier(value)
                  if (by) field.handleChange(by)
                }}
              />
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.values.by}>
            {(by) => (
              <form.Field key={by} name={by} validators={{ onSubmit: identifierSchemas[by] }}>
                {(field) => (
                  <InputField
                    field={field}
                    label={t(`lookups.new.${by}`)}
                    required
                    description={t(`lookups.new.${by}-hint`)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder={t(`lookups.new.${by}-placeholder`)}
                    className="uppercase placeholder:normal-case"
                  />
                )}
              </form.Field>
            )}
          </form.Subscribe>
          <form.Field name="query" validators={{ onSubmit: querySchema }}>
            {(field) => (
              <InputField
                field={field}
                label={t('lookups.new.query')}
                required
                description={t('lookups.new.query-hint')}
                autoComplete="off"
                maxLength={QUERY_LENGTH.max}
                placeholder={t('lookups.new.query-placeholder')}
              />
            )}
          </form.Field>
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
        <SubmitButton form={form}>
          {t('lookups.new.submit')}
          <ArrowRightIcon data-icon="inline-end" />
        </SubmitButton>
      </SheetFooter>
    </Form>
  )
}
