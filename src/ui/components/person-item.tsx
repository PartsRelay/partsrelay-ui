import { UserIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/components/ui/avatar'
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
        <Avatar>
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback>
            <UserIcon aria-hidden />
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle>{title}</ItemTitle>
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>
    </Item>
  )
}
