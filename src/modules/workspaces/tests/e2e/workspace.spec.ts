import { expect, type Page, test } from '@playwright/test'

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

const table = (page: Page, column: string) =>
  page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: column }) })

const members = (page: Page) => table(page, 'Member')

const invitations = (page: Page) => table(page, 'Sent')

test.describe('as the owner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workspace')
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible()
  })

  test('shows the members and the pending invitations', async ({ page }) => {
    await expect(page.getByText('4 members · 2 pending invitations')).toBeVisible()
    await expect(members(page).getByRole('row')).toHaveText([
      /Member/,
      /Mark Reed \(you\).*Owner.*Transfer ownership/,
      /Julia Bennett.*Admin.*Remove/,
      /Luke Foster.*Viewer.*Remove/,
      /Sarah Collins.*Viewer.*Remove/,
    ])
    await expect(invitations(page).getByRole('row')).toHaveText([
      /Email/,
      /f\.roberts@redwoodparts\.com.*Viewer/,
      /a\.evans@redwoodparts\.com.*Admin/,
      /north\.garage@gmail\.com.*Viewer.*Expired/,
    ])
  })

  test('inviting someone adds a pending invitation', async ({ page }) => {
    const email = page.getByRole('textbox', { name: 'Email' })
    await email.fill(' New.Buyer@RedwoodParts.com ')
    await page.getByRole('radio', { name: 'Admin' }).click()
    await expect(
      page.getByText('Admins manage contacts and can invite or remove viewers.')
    ).toBeVisible()
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await expect(
      notices(page).getByText('Invitation sent to new.buyer@redwoodparts.com.')
    ).toBeVisible()
    await expect(email).toBeEmpty()
    await expect(
      invitations(page).getByRole('row', { name: /new\.buyer@redwoodparts\.com/ })
    ).toContainText('Admin')
    await expect(page.getByText('4 members · 3 pending invitations')).toBeVisible()
  })

  test('inviting someone already invited explains why under the field', async ({ page }) => {
    const email = page.getByRole('textbox', { name: 'Email' })
    await email.fill('f.roberts@redwoodparts.com')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await expect(email).toHaveAccessibleDescription('This person already has a pending invitation.')
    await expect(email).toBeFocused()
    await expect(email).toHaveValue('f.roberts@redwoodparts.com')
    await expect(notices(page).getByText(/^Invitation sent/)).toHaveCount(0)
  })

  test('inviting a member explains why under the field', async ({ page }) => {
    const email = page.getByRole('textbox', { name: 'Email' })
    await email.fill('julia.bennett@redwoodparts.com')
    await page.getByRole('button', { name: 'Send invitation' }).click()

    await expect(email).toHaveAccessibleDescription('This person is already in the team.')
  })

  test('resending an invitation confirms it', async ({ page }) => {
    await page
      .getByRole('button', { name: 'Resend the invitation to f.roberts@redwoodparts.com' })
      .click()

    await expect(
      notices(page).getByText('Invitation sent again to f.roberts@redwoodparts.com.')
    ).toBeVisible()
  })

  test('revoking an invitation removes it for good', async ({ page }) => {
    await page
      .getByRole('button', { name: 'Revoke the invitation for a.evans@redwoodparts.com' })
      .click()
    const dialog = page.getByRole('alertdialog', {
      name: 'Revoke the invitation for a.evans@redwoodparts.com?',
    })
    await dialog.getByRole('button', { name: 'Revoke invitation' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      notices(page).getByText('Invitation revoked. The link no longer works.')
    ).toBeVisible()
    await expect(invitations(page).getByText('a.evans@redwoodparts.com')).toHaveCount(0)

    await page.reload()
    await expect(invitations(page).getByText('f.roberts@redwoodparts.com')).toBeVisible()
    await expect(invitations(page).getByText('a.evans@redwoodparts.com')).toHaveCount(0)
  })

  test('removing a member deletes their account', async ({ page }) => {
    await page.getByRole('button', { name: 'Remove Luke Foster' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Remove Luke Foster?' })
    await dialog.getByRole('button', { name: 'Remove and delete account' }).click()

    await expect(
      notices(page).getByText('Luke Foster was removed and their account deleted.')
    ).toBeVisible()
    await expect(members(page).getByRole('row', { name: /Luke Foster/ })).toHaveCount(0)
    await expect(page.getByText('3 members · 2 pending invitations')).toBeVisible()
  })

  test('transferring ownership makes me an admin', async ({ page }) => {
    await page.getByRole('button', { name: 'Transfer ownership' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Transfer ownership' })
    await dialog.getByRole('combobox', { name: 'New owner' }).click()
    await page.getByRole('option', { name: 'Julia Bennett · Admin' }).click()
    await dialog.getByRole('button', { name: 'Transfer ownership to Julia Bennett' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      notices(page).getByText("Ownership transferred to Julia Bennett. You're now an Admin.")
    ).toBeVisible()
    await expect(members(page).getByRole('row', { name: /Julia Bennett/ })).toContainText('Owner')
    await expect(members(page).getByRole('row', { name: /Mark Reed/ })).toContainText('Admin')
    await expect(page.getByRole('link', { name: 'Company' })).toHaveCount(0)
  })
})

test.describe('as an admin', () => {
  test.beforeEach(async ({ page }) => {
    // The mocks read who is signed in from localStorage
    await page.addInitScript(() => localStorage.setItem('mock.user', 'admin'))
    await page.goto('/workspace')
    await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible()
  })

  test('only viewer invitations can be managed', async ({ page }) => {
    await expect(
      invitations(page).getByRole('row', { name: /a\.evans@redwoodparts\.com/ })
    ).toContainText('Owner only')
    await expect(
      page.getByRole('button', { name: 'Resend the invitation to f.roberts@redwoodparts.com' })
    ).toBeVisible()
    await expect(page.getByRole('radio')).toHaveText(['Viewer'])
    await expect(page.getByText('As an admin you can invite viewers.')).toBeVisible()
  })

  test('the company page is not available', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Company' })).toHaveCount(0)

    await page.goto('/company')
    await expect(
      page.getByRole('heading', { level: 1, name: "You don't have access to this page." })
    ).toBeVisible()
    await expect(page.getByText('Ask Mark Reed, your company owner, for help.')).toBeVisible()
  })
})

test.describe('as a viewer', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
  })

  test('home is the contacts and the workspace is not available', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/contacts')
    await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Workspace' })).toHaveCount(0)

    await page.goto('/workspace')
    await expect(
      page.getByRole('heading', { level: 1, name: "You don't have access to this page." })
    ).toBeVisible()
    await page.getByRole('link', { name: 'Back to home' }).click()
    await expect(page).toHaveURL('/contacts')
  })
})
