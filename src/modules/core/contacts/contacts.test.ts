import { QueryClient } from '@tanstack/query-core'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { getApiV1WorkspaceContacts } from '@/core/api/endpoints/contacts/contacts'
import {
  blockConfirm,
  contactRow,
  contactsSearchSchema,
  removeContactConfirm,
  tabStatus,
} from '@/modules/core/contacts/contacts'
import {
  contactKeys,
  contactListParams,
  contactsQuery,
} from '@/modules/core/contacts/contacts.query'
import { createContactRename, renameKeyAction } from '@/modules/core/contacts/rename'
import { message } from '@/modules/core/shared/message'
import { companyFixture, contactFixture, meIn, pageFixture } from '@/modules/core/testing/fixtures'

vi.mock('@/core/api/endpoints/contacts/contacts', () => ({ getApiV1WorkspaceContacts: vi.fn() }))

const now = new Date(2026, 9, 15, 11, 5)
const workspace = companyFixture()
const owner = meIn(workspace, '101')
const admin = meIn(workspace, '102')
const viewer = meIn(workspace, '103')

const verdi = contactFixture(1, {
  waId: '390287341190',
  name: 'Officina Verdi',
  profileName: 'Paolo Verdi',
  lookupsCount: 412,
  monthLookupsCount: 38,
  lastLookupAt: new Date(2026, 9, 14, 16, 12).toISOString(),
})

beforeEach(() => vi.resetAllMocks())

describe('contact rows', () => {
  it('shows the given name, then the WhatsApp name, then the number', () => {
    expect(contactRow(verdi, owner, now, 'en')).toMatchObject({
      name: 'Officina Verdi',
      whatsappName: 'Paolo Verdi',
      phone: '+39 02 8734 1190',
    })
    expect(contactRow(contactFixture(2), owner, now)).toMatchObject({
      name: 'Contact 2',
      whatsappName: null,
      phone: '+39 333 412 8890',
    })
    expect(contactRow(contactFixture(3, { profileName: null }), owner, now).name).toBe(
      '+39 333 412 8890'
    )
    expect(
      contactRow(contactFixture(4, { name: 'Neri', profileName: 'Neri' }), owner, now).whatsappName
    ).toBeNull()
  })

  it('counts the searches and tells when the last one happened', () => {
    expect(contactRow(verdi, owner, now, 'en')).toMatchObject({
      added: '12 Mar 2026',
      searches: { total: 412, month: 38 },
      lastSearch: message('format.dateAt', { date: '14 Oct', time: '16:12' }),
      statusLabel: message('contacts.status.active'),
      tone: 'success',
    })
    expect(contactRow(verdi, owner, now, 'it').added).toBe('12 mar 2026')
    expect(contactRow(contactFixture(2), owner, now).lastSearch).toBeNull()
  })

  it('lets owners and admins manage contacts, viewers only read', () => {
    const blocked = contactFixture(5, { status: 'blocked' })

    expect(contactRow(verdi, owner, now).actions).toEqual({
      rename: true,
      block: true,
      unblock: false,
      remove: true,
    })
    expect(contactRow(blocked, admin, now)).toMatchObject({
      tone: 'danger',
      statusLabel: message('contacts.status.blocked'),
      actions: { rename: true, block: false, unblock: true, remove: true },
    })
    expect(Object.values(contactRow(verdi, viewer, now).actions)).not.toContain(true)
    expect(Object.values(contactRow(blocked, viewer, now).actions)).not.toContain(true)
  })
})

describe('confirmations', () => {
  it('names the contact to block or delete with its number', () => {
    const row = contactRow(verdi, owner, now, 'en')
    const facts = [
      { label: message('contacts.facts.phone'), value: '+39 02 8734 1190' },
      { label: message('contacts.facts.added'), value: '12 Mar 2026' },
    ]

    expect(blockConfirm(row)).toEqual({
      title: message('contacts.confirm.block.title', { name: 'Officina Verdi' }),
      body: message('contacts.confirm.block.body'),
      action: message('contacts.confirm.block.action'),
      tone: 'danger',
      facts,
    })
    expect(removeContactConfirm(row)).toEqual({
      title: message('contacts.confirm.remove.title', { name: 'Officina Verdi' }),
      body: message('contacts.confirm.remove.body'),
      action: message('contacts.confirm.remove.action'),
      tone: 'danger',
      facts,
    })
  })
})

describe('contact list', () => {
  it('reads the tab and page from the address', () => {
    expect(contactsSearchSchema.parse({})).toEqual({ page: 1 })
    expect(contactsSearchSchema.parse({ status: 'blocked', page: 3 })).toEqual({
      status: 'blocked',
      page: 3,
    })
    expect(contactsSearchSchema.parse({ status: 'pending', page: 0 })).toEqual({
      status: undefined,
      page: 1,
    })
    expect(tabStatus('active')).toBe('active')
    expect(tabStatus('all')).toBeUndefined()
  })

  it('asks the core for one status as a list', async () => {
    vi.mocked(getApiV1WorkspaceContacts).mockResolvedValue(pageFixture([verdi]))
    const params = contactListParams({ status: 'blocked', page: 2 })
    const client = new QueryClient()

    expect(contactListParams({ page: 1 })).toEqual({ page: 1, perPage: 20 })
    expect(params).toEqual({ status: ['blocked'], page: 2, perPage: 20 })
    expect(contactsQuery(params).queryKey).toEqual(contactKeys.list(params))

    await client.fetchQuery(contactsQuery(params))
    expect(getApiV1WorkspaceContacts).toHaveBeenCalledWith({ params })
    expect(axios.getUri({ url: '/contacts', params })).toBe(
      '/contacts?status%5B%5D=blocked&page=2&perPage=20'
    )
  })

  it('keeps the previous page while the next loads, not across tabs', () => {
    const client = new QueryClient()
    const previous = pageFixture([verdi])
    const active = { status: ['active' as const], page: 1, perPage: 20 }
    client.setQueryData(contactKeys.list(active), previous)
    const query = client.getQueryCache().find({ queryKey: contactKeys.list(active) })!
    const placeholder = (params: typeof active) =>
      contactsQuery(params).placeholderData(previous, query as never)

    expect(placeholder({ ...active, page: 2 })).toBe(previous)
    expect(placeholder({ ...active, status: ['blocked' as never] })).toBeUndefined()
    expect(contactsQuery(active).placeholderData(undefined, undefined)).toBeUndefined()
  })
})

describe('inline rename', () => {
  it('maps keys to actions', () => {
    expect(renameKeyAction('Enter')).toBe('save')
    expect(renameKeyAction('Escape')).toBe('cancel')
    expect(renameKeyAction('a')).toBeNull()
  })

  it('sends only real changes and clears with an empty name', () => {
    const contact = contactFixture(4, { name: 'Davide Russo' })
    const rename = createContactRename()

    rename.actions.start(contact)
    expect(rename.state).toMatchObject({ id: 4, draft: 'Davide Russo' })
    rename.actions.change(' Davide Russo ')
    expect(rename.actions.commit(contact)).toBeNull()
    expect(rename.state.id).toBeNull()

    rename.actions.start(contact)
    rename.actions.change('   ')
    expect(rename.actions.commit(contact)).toEqual({ id: 4, name: null })

    rename.actions.start(contact)
    rename.actions.change('x'.repeat(256))
    expect(rename.actions.commit(contact)).toBeNull()
    expect(rename.state.error?.key).toBe('contacts.errors.nameTooLong')
    rename.actions.cancel()
    expect(rename.state).toEqual({ id: null, draft: '', error: null })
  })
})
