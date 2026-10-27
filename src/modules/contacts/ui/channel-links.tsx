import { useQuery } from '@tanstack/react-query'
import { ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { channelsQuery } from '@/modules/contacts/core/channels'
import { CopyButton } from '@/ui/components/copy-button'
import { Button } from '@/ui/components/ui/button'
import { CardHeading } from '@/ui/components/card-heading'
import { Card, CardContent, CardDescription, CardHeader } from '@/ui/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/ui/components/ui/item'

export function ChannelLinks() {
  const { t } = useTranslation()
  const { data: channels = [] } = useQuery(channelsQuery)

  if (channels.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardHeading>{t('contacts.channels.title')}</CardHeading>
        <CardDescription>{t('contacts.channels.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {channels.map((channel) => (
          <Item key={channel.source} variant="outline">
            <ItemContent>
              <ItemTitle className="font-heading text-base whitespace-nowrap tabular-nums">
                {channel.address}
              </ItemTitle>
              <ItemDescription>{t(...channel.label)}</ItemDescription>
            </ItemContent>
            <ItemActions className="flex-wrap">
              <CopyButton text={channel.url} notice="contacts.channels.copied" size="sm">
                {t('contacts.channels.copy')}
              </CopyButton>
              <Button variant="outline" size="sm" asChild>
                <a href={channel.url} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon data-icon="inline-start" />
                  {t('contacts.channels.open')}
                </a>
              </Button>
            </ItemActions>
          </Item>
        ))}
      </CardContent>
    </Card>
  )
}
