import { CopyIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { copyText } from '@/core/clipboard'
import type { Message } from '@/core/message'
import { notify } from '@/ui/components/notify'
import { Button } from '@/ui/components/button'

type CopyButtonProps = ComponentProps<typeof Button> & { text: string; notice: Message }

export function CopyButton({ text, notice, children, ...props }: CopyButtonProps) {
  return (
    <Button
      variant="outline"
      {...props}
      onClick={async () => {
        const result = await copyText(text, notice)
        notify(result.tone === 'success' ? 'success' : 'error', result.message)
      }}
    >
      <CopyIcon />
      {children}
    </Button>
  )
}
