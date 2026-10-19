import { CopyIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useCopyToClipboard } from 'usehooks-ts'
import { type Message, message } from '@/core/message'
import { notify } from '@/ui/components/notify'
import { Button } from '@/ui/components/button'

type CopyButtonProps = ComponentProps<typeof Button> & { text: string; notice: Message }

export function CopyButton({ text, notice, children, ...props }: CopyButtonProps) {
  const [, copy] = useCopyToClipboard()

  return (
    <Button
      variant="outline"
      {...props}
      onClick={async () => {
        if (await copy(text)) notify('success', notice)
        else notify('error', message('notices.copyFailed'))
      }}
    >
      <CopyIcon />
      {children}
    </Button>
  )
}
