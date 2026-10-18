import { message } from '@/modules/core/shared/message'
import { ownerOf } from '@/modules/core/workspace/navigation'
import type { Workspace } from '@/modules/core/workspace/workspace'

export function accessHint(workspace: Workspace) {
  const owner = ownerOf(workspace)

  return owner
    ? message('shell.accessDenied.askOwner', { owner: owner.name })
    : message('shell.accessDenied.askAnyOwner')
}
