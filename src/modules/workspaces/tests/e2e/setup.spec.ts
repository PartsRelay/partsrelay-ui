import { expect, test } from '@playwright/test'

test.describe('as a newcomer', () => {
  test.beforeEach(async ({ page }) => {
    // A new account, its company still to set up
    await page.addInitScript(() => localStorage.setItem('mock.user', 'new'))
    await page.goto('/')
    await expect(page).toHaveURL('/setup')
    await expect(page.getByRole('heading', { level: 1, name: 'Set up your company' })).toBeVisible()
  })

  test('the setup starts empty, in the browser language', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Company name' })).toBeEmpty()
    await expect(page.getByRole('textbox', { name: 'Your name' })).toBeEmpty()
    await expect(page.getByRole('combobox', { name: 'WhatsApp language' })).toHaveText('English')
    await expect(page.getByText('Signed in as north.garage@gmail.com')).toBeVisible()
  })

  test('the company and my name are required', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()

    const company = page.getByRole('textbox', { name: 'Company name' })
    await expect(company).toBeFocused()
    await expect(company).toHaveAccessibleDescription('Enter your company name.')
    await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveAccessibleDescription(
      'Enter your name.'
    )
    await expect(page).toHaveURL('/setup')
  })

  test('setting up opens the app for good', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Company name' }).fill('North Garage Ltd')
    await page.getByRole('textbox', { name: 'Your name' }).fill('Anna North')
    await page.getByRole('combobox', { name: 'WhatsApp language' }).click()
    await page.getByRole('option', { name: 'Italian' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL('/contacts')
    await expect(page.getByRole('link', { name: /North Garage Ltd/ })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()

    await page.goto('/workspace')
    await expect(page.getByRole('row', { name: /Anna North \(you\)/ })).toContainText('Owner')

    await page.goto('/company')
    await expect(page.getByRole('combobox', { name: 'Reply language' })).toHaveText('Italian')

    await page.goto('/')
    await expect(page).toHaveURL('/contacts')
  })

  test('signing out leaves the setup', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click()

    await expect(page).toHaveURL('/login')
  })
})

test.describe('as an owner with a name', () => {
  test('the setup only asks about the company', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.setup', 'pending'))
    await page.goto('/workspace')

    await expect(page).toHaveURL('/setup')
    await expect(page.getByRole('textbox', { name: 'Company name' })).toBeEmpty()
    await expect(page.getByRole('textbox', { name: 'Your name' })).toHaveCount(0)
  })
})
