import { initials } from '@/core/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/components/avatar'

export function PersonAvatar({ name, image }: { name: string; image?: string | null }) {
  return (
    <Avatar>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}
