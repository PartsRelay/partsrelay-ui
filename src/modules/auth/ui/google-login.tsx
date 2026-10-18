import { type UseMutationOptions, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui/components/button'
import { Spinner } from '@/ui/components/spinner'

type GoogleLoginProps = { signIn: UseMutationOptions<unknown, Error, void> }

export function GoogleLogin({ signIn }: GoogleLoginProps) {
  const { t } = useTranslation()
  const mutation = useMutation(signIn)

  return (
    <Button className="w-full" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending && <Spinner data-icon="inline-start" />}
      {t('login.google')}
    </Button>
  )
}
