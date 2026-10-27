import { UserIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/components/ui/avatar'

type PersonAvatarProps = { name: string; image?: string | null }

export function PersonAvatar({ name, image }: PersonAvatarProps) {
  const initial = name.match(/\p{L}/u)?.[0]

  return (
    <Avatar>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback className="bg-secondary font-heading font-semibold text-secondary-foreground uppercase">
        {initial ?? <UserIcon aria-hidden className="size-4" />}
      </AvatarFallback>
    </Avatar>
  )
}
