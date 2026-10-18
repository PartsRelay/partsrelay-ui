import { CopyIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { toast } from 'sonner'
import { copyText } from '@/modules/core/shared/clipboard'
import type { Message } from '@/modules/core/shared/message'
import { useT } from '@/modules/ui/shared/use-t'
import { Button } from '@/ui/components/ui/button'

type CopyButtonProps = ComponentProps<typeof Button> & { text: string; notice: Message }

export function CopyButton({ text, notice, children, ...props }: CopyButtonProps) {
  const translate = useT()

  return (
    <Button
      variant="outline"
      {...props}
      onClick={async () => {
        const result = await copyText(text, notice)
        toast[result.tone === 'success' ? 'success' : 'error'](translate(result.message))
      }}
    >
      <CopyIcon />
      {children}
    </Button>
  )
}
