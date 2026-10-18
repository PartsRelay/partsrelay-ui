import { describe, expect, it } from 'vite-plus/test'
import { message } from '@/core/message'
import { createInviteForm, roleHint } from '@/modules/workspaces/core/invite-form'
import {
  invitationRows,
  memberRows,
  removeMemberConfirm,
  revokeConfirm,
  teamSearchSchema,
  teamSummary,
  transferAction,
  transferCandidates,
} from '@/modules/workspaces/core/team'
import { companyFixture, invitation, meIn } from '@/core/testing/fixtures'

const now = new Date('2026-10-12T10:00:00Z')
const origin = 'https://app.partsrelay.com'

describe('members', () => {
  it('lets the owner hand over the company, change roles and remove', () => {
    const workspace = companyFixture()
    const rows = memberRows(workspace, meIn(workspace, '101'))

    expect(rows.map((row) => [row.member.name, row.isMe])).toEqual([
      ['Marco Rossi', true],
      ['Giulia Bianchi', false],
      ['Luca Ferri', false],
    ])
    expect(rows[0]).toMatchObject({ roleOptions: null, canTransfer: true, canRemove: false })
    expect(rows[1]).toMatchObject({
      roleOptions: ['viewer', 'admin'],
      canTransfer: false,
      canRemove: true,
    })
  })

  it('lets an admin remove viewers only', () => {
    const workspace = companyFixture()
    const rows = memberRows(workspace, meIn(workspace, '102'))

    expect(
      rows.map((row) => [row.member.name, row.canTransfer, row.roleOptions, row.canRemove])
    ).toEqual([
      ['Marco Rossi', false, null, false],
      ['Giulia Bianchi', false, null, false],
      ['Luca Ferri', false, null, true],
    ])
  })

  it('offers the other members as the new owner', () => {
    const workspace = companyFixture()
    const owner = meIn(workspace, '101')
    const [giulia] = transferCandidates(workspace, owner)

    expect(transferCandidates(workspace, owner).map((member) => member.name)).toEqual([
      'Giulia Bianchi',
      'Luca Ferri',
    ])
    expect(transferCandidates({ ...workspace, members: [owner.member] }, owner)).toEqual([])
    expect(transferAction()).toEqual(message('team.transfer.title'))
    expect(transferAction(giulia)).toEqual(
      message('team.transfer.action', { name: 'Giulia Bianchi' })
    )
  })

  it('opens the transfer from the address', () => {
    expect(teamSearchSchema.parse({ transfer: true })).toEqual({ transfer: true })
    expect(teamSearchSchema.parse({ transfer: 'yes' })).toEqual({ transfer: undefined })
    expect(teamSearchSchema.parse({})).toEqual({})
  })

  it('counts the members and the invitations still valid', () => {
    const workspace = companyFixture()
    workspace.invitations.push(
      invitation('i3', 'viewer', 'F.Romano@ricambirossi.it', '2026-10-18T10:00:00Z'),
      { ...invitation('i4', 'viewer', 'gone@x.it', '2026-10-18T10:00:00Z'), status: 'canceled' },
      invitation('i5', 'viewer', 'new@x.it', '2026-10-19T10:00:00Z')
    )

    expect(teamSummary(workspace, now)).toEqual([
      message('team.summary.members', { count: 3 }),
      message('team.summary.invitations', { count: 2 }),
    ])
  })

  it('says that removing a member deletes the account', () => {
    const workspace = companyFixture()
    const giulia = workspace.members[2]!

    expect(removeMemberConfirm(giulia, workspace)).toEqual({
      title: message('team.confirm.remove.title', { name: 'Giulia Bianchi' }),
      body: message('team.confirm.remove.body', {
        name: 'Giulia Bianchi',
        company: 'Ricambi Rossi S.r.l.',
      }),
      action: message('team.confirm.remove.action'),
      tone: 'danger',
      facts: [
        { label: message('team.confirm.email'), value: 'giulia@ricambirossi.it' },
        { label: message('team.confirm.role'), value: message('roles.admin') },
      ],
    })
  })
})

describe('invitations', () => {
  it('lists pending ones with links, sent dates and expiry', () => {
    const workspace = companyFixture()
    const rows = invitationRows(workspace, meIn(workspace, '101'), now, origin, 'en')

    expect(
      rows.map((row) => [row.invitation.id, row.sent, row.expired, row.canManage, row.link])
    ).toEqual([
      ['i1', '8 Oct 2026', false, true, 'https://app.partsrelay.com/invitations/i1'],
      ['i2', '29 Sept 2026', true, true, 'https://app.partsrelay.com/invitations/i2'],
    ])
    expect(invitationRows(workspace, meIn(workspace, '101'), now, origin, 'it')[0]!.sent).toBe(
      '8 ott 2026'
    )
  })

  it('keeps the newest invitation per email and admin limits', () => {
    const workspace = companyFixture()
    workspace.invitations.push(
      invitation('i3', 'admin', 'Officina.Neri@gmail.com', '2026-10-18T10:00:00Z'),
      { ...invitation('i4', 'viewer', 'gone@x.it', '2026-10-18T10:00:00Z'), status: 'canceled' },
      invitation('i5', 'viewer', 'old@x.it', '2026-10-14T10:00:00Z'),
      { ...invitation('i6', 'viewer', 'old@x.it', '2026-10-16T10:00:00Z'), status: 'accepted' },
      invitation('i7', 'viewer', 'Luca@ricambirossi.it', '2026-10-16T10:00:00Z')
    )
    const rows = invitationRows(workspace, meIn(workspace, '102'), now, origin)

    expect(rows.map((row) => [row.invitation.id, row.canManage])).toEqual([
      ['i3', false],
      ['i1', true],
    ])
  })

  it('names the invitation to revoke', () => {
    const workspace = companyFixture()
    const [row] = invitationRows(workspace, meIn(workspace, '101'), now, origin, 'en')

    expect(revokeConfirm(row!)).toEqual({
      title: message('team.confirm.revoke.title', { email: 'f.romano@ricambirossi.it' }),
      body: message('team.confirm.revoke.body'),
      action: message('team.confirm.revoke.action'),
      tone: 'danger',
      facts: [
        { label: message('team.confirm.role'), value: message('roles.viewer') },
        { label: message('team.confirm.sent'), value: '8 Oct 2026' },
      ],
    })
  })
})

describe('invite form', () => {
  it('offers roles and hints by role', () => {
    const workspace = companyFixture()
    const owner = meIn(workspace, '101')
    const admin = meIn(workspace, '102')

    expect(createInviteForm(owner).state.role).toBe('viewer')
    expect(roleHint('admin', owner)).toEqual(message('team.invite.hints.admin'))
    expect(roleHint('viewer', admin)).toEqual(message('team.invite.hints.adminInvitesViewers'))

    const form = createInviteForm(admin)
    form.actions.setRole('admin')
    expect(form.state.role).toBe('viewer')
  })

  it('validates before sending', () => {
    const workspace = companyFixture()
    const form = createInviteForm(meIn(workspace, '101'))

    form.actions.setEmail('not-an-email')
    expect(form.actions.submit(workspace, now)).toBeNull()
    expect(form.state.error).toEqual(message('team.invite.errors.email'))

    form.actions.setEmail('luca@ricambirossi.it')
    expect(form.actions.submit(workspace, now)).toBeNull()
    expect(form.state.error).toEqual(message('team.invite.errors.member'))

    form.actions.setEmail('F.Romano@ricambirossi.it')
    expect(form.actions.submit(workspace, now)).toBeNull()
    expect(form.state.error).toEqual(message('team.invite.errors.invited'))

    form.actions.setEmail(' Officina.Neri@gmail.com ')
    form.actions.setRole('admin')
    expect(form.actions.submit(workspace, now)).toEqual({
      email: 'officina.neri@gmail.com',
      role: 'admin',
    })
    expect(form.state.error).toBeNull()
  })

  it('clears the email once sent and keeps the role', () => {
    const workspace = companyFixture()
    const form = createInviteForm(meIn(workspace, '101'))

    form.actions.setEmail('nope')
    form.actions.setRole('admin')
    form.actions.submit(workspace, now)
    form.actions.reset()

    expect(form.state).toEqual({ email: '', role: 'admin', error: null })
  })
})
