import { expect, type Page, test } from '@playwright/test'

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

test.describe('as the owner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible()
  })

  test('renaming me updates the whole app', async ({ page }) => {
    const name = page.getByRole('textbox', { name: 'Name' })
    await expect(name).toHaveValue('Mark Reed')

    await name.fill('  Mark Reed Jr  ')
    await page.getByRole('button', { name: 'Save name' }).click()

    await expect(notices(page).getByText('Name saved.')).toBeVisible()
    await expect(name).toHaveValue('Mark Reed Jr')
    await expect(page.getByRole('button', { name: /Mark Reed Jr/ })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Mark Reed Jr')
  })

  test('my name cannot be empty', async ({ page }) => {
    const name = page.getByRole('textbox', { name: 'Name' })

    await name.fill('   ')
    await page.getByRole('button', { name: 'Save name' }).click()

    await expect(name).toBeFocused()
    await expect(name).toHaveAccessibleDescription('Enter your name.')

    await name.fill('Mark')
    await expect(name).toHaveAccessibleDescription('Your team sees it next to your email.')
  })

  test('the owner has to hand over the company before leaving', async ({ page }) => {
    await expect(page.getByText('The owner cannot leave')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Leave company' })).toHaveCount(0)

    await page.getByRole('link', { name: 'Transfer ownership' }).click()
    await expect(page).toHaveURL('/workspace?transfer=true')
    await expect(page.getByRole('alertdialog', { name: 'Transfer ownership' })).toBeVisible()
  })
})

test.describe('as a viewer', () => {
  test.beforeEach(async ({ page }) => {
    // The mocks read who is signed in from localStorage
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
  })

  test('leaving the company deletes my account and signs me out', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Leave company' }).click()

    const dialog = page.getByRole('alertdialog', { name: 'Leave Redwood Parts Ltd?' })
    await dialog.getByRole('button', { name: 'Leave and delete my account' }).click()

    await expect(page).toHaveURL('/login')
    await expect(
      notices(page).getByText('You left Redwood Parts Ltd and your account was deleted.')
    ).toBeVisible()
  })
})
