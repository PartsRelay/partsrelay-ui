import { useQuery } from '@tanstack/react-query'
import { ExternalLinkIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { channelsQuery } from '@/modules/contacts/core/channels'
import { CopyButton } from '@/ui/components/copy-button'
import { Button } from '@/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/ui/card'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/ui/components/ui/item'

export function ChannelLinks() {
  const { t } = useTranslation()
  const { data: channels = [] } = useQuery(channelsQuery)

  if (channels.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('contacts.channels.title')}</h2>
        </CardTitle>
        <CardDescription>{t('contacts.channels.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {channels.map((channel) => (
          <Item key={channel.source} variant="outline">
            <ItemContent>
              <ItemTitle className="tabular-nums">{channel.address}</ItemTitle>
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
