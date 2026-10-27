import { useTranslation } from 'react-i18next'
import { googleEnabled, type SignInFlow } from '@/modules/auth/core/sign-in'
import { GoogleLogin } from '@/modules/auth/ui/google-login'
import { MagicLinkForm } from '@/modules/auth/ui/magic-link-form'
import { useOneTap } from '@/modules/auth/ui/hooks/use-one-tap'
import { FieldSeparator } from '@/ui/components/ui/field'

export function SignInOptions({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  useOneTap(flow.back)

  return (
    <div className="grid gap-6">
      {googleEnabled && (
        <>
          <GoogleLogin flow={flow} />
          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
            {t('login.or')}
          </FieldSeparator>
        </>
      )}
      <MagicLinkForm flow={flow} />
    </div>
  )
}
