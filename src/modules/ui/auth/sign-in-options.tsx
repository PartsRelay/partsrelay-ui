import { useTranslation } from 'react-i18next'
import type { SignInFlow } from '@/modules/core/auth/sign-in'
import { GoogleLogin } from '@/modules/ui/auth/google-login'
import { MagicLinkForm } from '@/modules/ui/auth/magic-link-form'
import { useOneTap } from '@/modules/ui/auth/use-one-tap'
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
