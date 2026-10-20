import { CopyIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useCopyToClipboard } from 'usehooks-ts'
import { notify } from '@/ui/components/notify'
import { Button } from '@/ui/components/ui/button'

type CopyButtonProps = ComponentProps<typeof Button> & { text: string; notice: string }

export function CopyButton({ text, notice, children, ...props }: CopyButtonProps) {
  const { t } = useTranslation()
  const [, copy] = useCopyToClipboard()

  return (
    <Button
      variant="outline"
      {...props}
      onClick={async () => {
        if (await copy(text)) notify('success', notice)
        else notify('error', t('notices.copyFailed'))
      }}
    >
      <CopyIcon />
      {children}
    </Button>
  )
}
