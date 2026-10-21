import { message } from '@/core/message'
import { ownerOf } from '@/modules/workspaces/core/navigation'
import type { Workspace } from '@/modules/workspaces/core/workspace'

export function accessHint(workspace: Workspace) {
  const owner = ownerOf(workspace)

  return owner
    ? message('shell.access-denied.ask-owner', { owner: owner.name })
    : message('shell.access-denied.ask-any-owner')
}
