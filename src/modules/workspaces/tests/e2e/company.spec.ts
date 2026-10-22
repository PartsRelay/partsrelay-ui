import { expect, type Page, test } from '@playwright/test'

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

test.beforeEach(async ({ page }) => {
  await page.goto('/company')
  await expect(page.getByRole('heading', { level: 1, name: 'Company' })).toBeVisible()
})

test('the sidebar and the breadcrumbs show where I am', async ({ page }) => {
  // The current breadcrumb is a disabled link too
  const company = page.getByRole('link', { name: 'Company', disabled: false })
  await expect(company).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('link', { name: 'Workspace' })).not.toHaveAttribute('aria-current')
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(
    /Workspace.*Company/
  )

  await page.getByRole('link', { name: 'Workspace' }).click()
  await expect(page).toHaveURL('/workspace')
  await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible()
})

test('on a phone the menu closes once I pick a page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  const menu = page.getByRole('dialog')
  await menu.getByRole('link', { name: 'Workspace' }).click()

  await expect(page).toHaveURL('/workspace')
  await expect(menu).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible()

  await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await menu.getByRole('button', { name: /Mark Reed/ }).click()
  await page.getByRole('menuitem', { name: 'Profile' }).click()

  await expect(page).toHaveURL('/profile')
  await expect(menu).toBeHidden()
  await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
})

test('renaming the company updates the whole app', async ({ page }) => {
  const name = page.getByRole('textbox', { name: 'Name' })
  await expect(name).toHaveValue('Redwood Parts Ltd')

  await name.fill(' Redwood Spares Ltd ')
  await page.getByRole('button', { name: 'Save name' }).click()

  await expect(notices(page).getByText('Company name saved.')).toBeVisible()
  await expect(name).toHaveValue('Redwood Spares Ltd')
  await expect(page.getByRole('link', { name: /Redwood Spares Ltd/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Redwood Spares Ltd')
})

test('the company name cannot be empty', async ({ page }) => {
  const name = page.getByRole('textbox', { name: 'Name' })

  await name.clear()
  await page.getByRole('button', { name: 'Save name' }).click()

  await expect(name).toBeFocused()
  await expect(name).toHaveAccessibleDescription('Enter the company name.')
  await expect(page.getByRole('link', { name: /Redwood Parts Ltd/ })).toBeVisible()
})

test('changing the WhatsApp language keeps the app language', async ({ page }) => {
  const language = page.getByRole('combobox', { name: 'Reply language' })
  await expect(language).toHaveText('English')

  await language.click()
  await page.getByRole('option', { name: 'Italian' }).click()

  await expect(notices(page).getByText('WhatsApp language set to Italian.')).toBeVisible()
  await expect(language).toHaveText('Italian')
  await expect(page.getByRole('heading', { level: 1, name: 'Company' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Reply language' })).toHaveText('Italian')
})

test('deleting the company signs everyone out', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete company' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Delete Redwood Parts Ltd?' })
  await dialog.getByRole('button', { name: 'Delete company and accounts' }).click()

  await expect(page).toHaveURL('/login')
  await expect(
    notices(page).getByText(
      'The company and every account were deleted. Signing in again starts a new company.'
    )
  ).toBeVisible()
})
