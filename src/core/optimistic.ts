import type { QueryClient, QueryKey } from '@tanstack/query-core'

// Shows the change at once and undoes it if the call fails
export async function optimistic<TData>(
  client: QueryClient,
  queryKey: QueryKey,
  update: (data: TData, key: QueryKey) => TData,
  call: () => Promise<unknown>
) {
  await client.cancelQueries({ queryKey })
  const snapshot = client.getQueriesData<TData>({ queryKey })

  for (const [key, data] of snapshot) {
    if (data !== undefined) client.setQueryData<TData>(key, update(data, key))
  }

  try {
    return await call()
  } catch (error) {
    for (const [key, data] of snapshot) client.setQueryData(key, data)
    throw error
  } finally {
    await client.invalidateQueries({ queryKey })
  }
}
