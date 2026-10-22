import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage, errorStatus, NO_STATUS } from '@/core/errors'
import { useAppForm } from '@/form'
import { failureNotice } from '@/modules/auth/core/session.query'
import { searchFormSchema } from '@/modules/searches/core/search'
import { searchKeys, startSearch } from '@/modules/searches/core/searches.query'
import { useMe } from '@/modules/workspaces/ui/hooks/use-me'
import { Button } from '@/ui/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/ui/components/ui/sheet'

export function NewSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const { me, workspace } = useMe()
  const submitting = useRef(false)
  const navigate = useNavigate()
  const client = useQueryClient()
  const create = useMutation({ mutationFn: startSearch, retry: false, meta: { silent: true } })
  const failureStatus = create.isError ? errorStatus(create.error) : null
  const acceptanceUnknown =
    create.isError &&
    (failureStatus === NO_STATUS || (failureStatus !== null && failureStatus >= 500))
  const form = useAppForm({
    defaultValues: { plate: '', query: '' },
    onSubmit: async ({ value, formApi }) => {
      if (submitting.current) return
      const result = searchFormSchema.safeParse(value)
      if (!result.success) return
      submitting.current = true
      try {
        let search
        try {
          search = await create.mutateAsync(result.data)
        } catch (error) {
          failureNotice(client, error, true)
          return
        }
        // Acceptance is complete; a slow history refresh must not delay the result.
        void client.invalidateQueries({ queryKey: searchKeys.all(workspace.id) })
        formApi.reset()
        onOpenChange(false)
        void navigate({ to: '/searches/$searchId', params: { searchId: String(search.id) } })
      } finally {
        submitting.current = false
      }
    },
  })
  function close(next: boolean) {
    if (!submitting.current && !create.isPending) {
      onOpenChange(next)
      create.reset()
    }
  }
  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent className="new-search-sheet" showCloseButton={false}>
        <SheetHeader className="new-search-heading">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">{t('searches.new.eyebrow')}</p>
            <SheetClose asChild>
              <Button variant="outline" disabled={create.isPending}>
                {t('common.close')} ×
              </Button>
            </SheetClose>
          </div>
          <SheetTitle>{t('searches.new.title')}</SheetTitle>
          <SheetDescription>{t('searches.new.description')}</SheetDescription>
        </SheetHeader>
        <form.AppForm>
          <form.Form className="new-search-form">
            <section>
              <h3>{t('searches.new.vehicle-step')}</h3>
              <form.AppField
                name="plate"
                validators={{
                  onSubmit: ({ value }) =>
                    searchFormSchema.shape.plate.safeParse(value).success
                      ? undefined
                      : 'searches.new.plate-error',
                }}
              >
                {(field) => (
                  <field.InputField
                    label={t('searches.new.plate')}
                    required
                    description={t('searches.new.plate-hint')}
                    maxLength={16}
                    autoComplete="off"
                    autoCapitalize="characters"
                    disabled={create.isPending}
                    placeholder={t('searches.new.plate-placeholder')}
                  />
                )}
              </form.AppField>
            </section>
            <section>
              <h3>{t('searches.new.part-step')}</h3>
              <form.AppField
                name="query"
                validators={{
                  onSubmit: ({ value }) =>
                    searchFormSchema.shape.query.safeParse(value).success
                      ? undefined
                      : 'searches.new.query-error',
                }}
              >
                {(field) => (
                  <field.InputField
                    label={t('searches.new.part')}
                    required
                    description={t('searches.new.part-hint')}
                    maxLength={200}
                    disabled={create.isPending}
                    placeholder={t('searches.new.part-placeholder')}
                  />
                )}
              </form.AppField>
            </section>
            <div className="info-banner">
              <img src="/brand/info.svg" alt="" />
              <div>
                <strong>{t('searches.new.tips')}</strong>
                <p>{t('searches.new.tips-body')}</p>
              </div>
            </div>
            <div className="muted">
              <p>{t('searches.new.requester', { name: me.member.name })}</p>
              <p className="mt-3">{t('searches.fitment')}</p>
            </div>
            {create.isError && (
              <div role="alert" className="form-error">
                <p>{t(...errorMessage(create.error))}</p>
                {acceptanceUnknown && (
                  <>
                    <p>{t('searches.new.acceptance-unknown')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false)
                        void navigate({ to: '/searches', search: { page: 1, requester: 'all' } })
                      }}
                    >
                      {t('searches.new.check-queue')}
                    </Button>
                  </>
                )}
              </div>
            )}
            <div className="new-search-actions">
              <Button
                type="button"
                variant="outline"
                disabled={create.isPending}
                onClick={() => close(false)}
              >
                {t('confirm.cancel')}
              </Button>
              <form.SubmitButton disabled={create.isPending}>
                {create.isPending ? t('searches.new.submitting') : t('searches.new.submit')}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </SheetContent>
    </Sheet>
  )
}
