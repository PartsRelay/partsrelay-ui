import { expect, type Page, test } from '@playwright/test'

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

test.describe('as a newcomer invited to a company', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mock.user', 'new')
      localStorage.setItem('mock.invitation', '1')
    })
  })

  test('accepting moves me to the inviting company', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/setup')

    await page.getByRole('link', { name: 'Open the invitation' }).click()
    await expect(page).toHaveURL('/invitations/31')
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 's.hale@ironworksgarage.com invited you to join Ironworks Garage Ltd',
      })
    ).toBeVisible()
    await expect(page.getByText(/^You'll join as Admin/)).toBeVisible()

    await page.getByRole('textbox', { name: 'Your name' }).fill('Anna North')
    await page.getByRole('button', { name: 'Accept invitation' }).click()

    await expect(page).toHaveURL('/lookups')
    await expect(notices(page).getByText('Ironworks Garage Ltd is now your company.')).toBeVisible()
    await expect(page.getByRole('link', { name: /Ironworks Garage Ltd/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Anna North/ })).toBeVisible()
  })

  test('my name is required before joining', async ({ page }) => {
    await page.goto('/invitations/31')
    await page.getByRole('button', { name: 'Accept invitation' }).click()

    const name = page.getByRole('textbox', { name: 'Your name' })
    await expect(name).toBeFocused()
    await expect(name).toHaveAccessibleDescription('Enter your name.')
    await expect(page).toHaveURL('/invitations/31')
  })

  test('not now keeps my own company', async ({ page }) => {
    await page.goto('/invitations/31')
    await page.getByRole('link', { name: 'Not now' }).click()

    await expect(page).toHaveURL('/setup')
    await expect(page.getByRole('heading', { level: 1, name: 'Set up your company' })).toBeVisible()
  })
})

test.describe('as the owner of a company', () => {
  test('an invitation for another address asks to switch account', async ({ page }) => {
    await page.goto('/invitations/7')

    const problem = page.getByRole('alert')
    await expect(problem).toContainText('This invitation is for another email address.')
    await expect(problem).toContainText("You're signed in as mark.reed@redwoodparts.com.")
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeEnabled()
  })

  test('signing out there offers the sign in options', async ({ page }) => {
    await page.goto('/invitations/7')
    await page.getByRole('button', { name: 'Sign out' }).click()

    await expect(notices(page).getByText('You signed out.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  })

  test('an unknown invitation is not available', async ({ page }) => {
    await page.goto('/invitations/404')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Invitation not available' })
    ).toBeVisible()
    await expect(
      page.getByText('This invitation has expired or was already used. Ask for a new one.')
    ).toBeVisible()

    await page.getByRole('link', { name: /^Go to / }).click()
    await expect(page).toHaveURL('/lookups')
  })
})
