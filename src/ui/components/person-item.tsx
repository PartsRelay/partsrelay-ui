import type { ReactNode } from 'react'
import { PersonAvatar } from '@/ui/components/person-avatar'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/ui/components/ui/item'

type PersonItemProps = {
  name: string
  email: string
  image?: string | null
  title?: ReactNode
}

export function PersonItem({ name, email, image, title = name }: PersonItemProps) {
  return (
    <Item size="xs" className="flex-nowrap gap-3 p-0">
      <ItemMedia>
        <PersonAvatar name={name} image={image} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{email}</ItemDescription>
      </ItemContent>
    </Item>
  )
}
