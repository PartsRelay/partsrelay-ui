import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import type { MessageValues } from '@/core/message'
import { reportError } from '@/query-client'
import { notify } from '@/ui/components/notify'

type ActionOptions = { notice?: string; values?: MessageValues; silent?: boolean }

export type ActionResult = { ok: true } | { ok: false; error: unknown }

// Runs a Better Auth call as a transition, then notifies
export function useBetterAuthAction() {
  const client = useQueryClient()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<unknown>(null)

  function run(action: () => Promise<unknown>, { notice, values, silent }: ActionOptions = {}) {
    return new Promise<ActionResult>((resolve) => {
      startTransition(async () => {
        setError(null)
        try {
          await action()
          if (notice) notify('success', notice, { values })
          resolve({ ok: true })
        } catch (failure) {
          setError(failure)
          reportError(failure, silent)
          resolve({ ok: false, error: failure })
        }
      })
    })
  }

  return { client, pending, error, run }
}
