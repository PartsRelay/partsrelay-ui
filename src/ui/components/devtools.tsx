import { TanStackDevtools } from '@tanstack/react-devtools'
import { PacerDevtoolsPanel } from '@tanstack/react-pacer-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

export function Devtools() {
  return (
    <TanStackDevtools
      plugins={[
        { name: 'Router', render: <TanStackRouterDevtoolsPanel /> },
        { name: 'Query', render: <ReactQueryDevtoolsPanel /> },
        { name: 'Pacer', render: <PacerDevtoolsPanel /> },
      ]}
    />
  )
}
