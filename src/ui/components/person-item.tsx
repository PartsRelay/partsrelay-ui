import type { ReactNode } from 'react'
import { PersonAvatar } from '@/ui/components/person-avatar'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/ui/components/ui/item'

type PersonItemProps = {
  name: string
  description?: ReactNode
  image?: string | null
  title?: ReactNode
}

export function PersonItem({ name, description, image, title = name }: PersonItemProps) {
  return (
    <Item size="sm" className="flex-nowrap gap-3 p-0">
      <ItemMedia>
        <PersonAvatar name={name} image={image} />
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle>{title}</ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>
    </Item>
  )
}
