import { useTranslation } from 'react-i18next'
import { env } from '@/env'
export function PreviewNotice() {
  const { t } = useTranslation()
  if (!env.API_MOCKS && !env.LOCAL_REVIEW_AUTH) return null
  return (
    <div className="info-banner preview-notice" role="status">
      <img src="/brand/info.svg" alt="" />
      <div>
        <strong>
          {t(env.LOCAL_REVIEW_AUTH ? 'login.local-review.title' : 'design.preview-title')}
        </strong>
        <p>
          {t(env.LOCAL_REVIEW_AUTH ? 'login.local-review.notice' : 'design.preview-description')}
        </p>
      </div>
    </div>
  )
}
