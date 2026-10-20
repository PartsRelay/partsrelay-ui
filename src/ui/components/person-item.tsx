import type { ReactNode } from 'react'
import { initials } from '@/core/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/components/ui/avatar'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/ui/components/ui/item'

type PersonItemProps = {
  name: string
  email: string
  image?: string | null
  title?: ReactNode
}

export function PersonItem({ name, email, image, title = name }: PersonItemProps) {
  return (
    <Item size="sm" className="flex-nowrap gap-3 p-0">
      <ItemMedia>
        <Avatar>
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{email}</ItemDescription>
      </ItemContent>
    </Item>
  )
}
