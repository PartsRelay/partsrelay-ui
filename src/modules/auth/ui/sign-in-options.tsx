import { useTranslation } from 'react-i18next'
import { env } from '@/env'
import { mocksEnabled } from '@/mocks/enabled'
import type { SignInFlow } from '@/modules/auth/core/sign-in'
import { GoogleLogin } from '@/modules/auth/ui/google-login'
import { MagicLinkForm } from '@/modules/auth/ui/magic-link-form'
import { useOneTap } from '@/modules/auth/ui/hooks/use-one-tap'
import { FieldSeparator } from '@/ui/components/ui/field'

const google = Boolean(env.GOOGLE_CLIENT_ID) || mocksEnabled

export function SignInOptions({ flow }: { flow: SignInFlow }) {
  const { t } = useTranslation()
  useOneTap(flow.back)

  return (
    <div className="grid gap-6">
      {google && (
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
