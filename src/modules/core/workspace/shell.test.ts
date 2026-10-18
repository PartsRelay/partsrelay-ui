import { describe, expect, it } from 'vite-plus/test'
import { message } from '@/modules/core/shared/message'
import { companyFixture } from '@/modules/core/testing/fixtures'
import { accessHint } from '@/modules/core/workspace/shell'

describe('shell', () => {
  it('names the owner to ask for access', () => {
    const workspace = companyFixture()

    expect(accessHint(workspace)).toEqual(
      message('shell.accessDenied.askOwner', { owner: 'Marco Rossi' })
    )
    expect(accessHint({ ...workspace, members: [] })).toEqual(
      message('shell.accessDenied.askAnyOwner')
    )
  })
})
