import { useTranslation } from 'react-i18next'
import type { SignInFlow } from '@/modules/auth/core/sign-in'
import { GoogleLogin } from '@/modules/auth/ui/google-login'
import { MagicLinkForm } from '@/modules/auth/ui/magic-link-form'
import { useOneTap } from '@/modules/auth/ui/use-one-tap'
import { FieldSeparator } from '@/ui/components/ui/field'

export function SignInOptions({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  useOneTap(flow.afterSignIn)

  return (
    <div className="grid gap-6">
      <GoogleLogin signIn={flow.google} />
      <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
        {t('login.or')}
      </FieldSeparator>
      <MagicLinkForm send={flow.magicLink} />
    </div>
  )
}
