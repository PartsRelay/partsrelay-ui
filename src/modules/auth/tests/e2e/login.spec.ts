import { expect, type Page, test } from '@playwright/test'

// The mocks start signed in, as Mark Reed, the owner
async function signOut(page: Page) {
  await page.goto('/profile')
  await page.getByRole('button', { name: /Mark Reed/ }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login')
  // Leaving before the lazy login page loads reloads it
  await expect(page.getByRole('heading', { level: 1, name: /^Sign in to / })).toBeVisible()
}

const notices = (page: Page) => page.getByRole('region', { name: /Notifications/ })

test.beforeEach(async ({ page }) => {
  await signOut(page)
})

test('signing out lands on the login page', async ({ page }) => {
  await expect(notices(page).getByText('You signed out.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: /^Sign in to / })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty()
})

test('the magic link form rejects an invalid email', async ({ page }) => {
  const email = page.getByRole('textbox', { name: 'Email' })

  await email.fill('mark.reed@')
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click()

  await expect(email).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('Enter a valid email address.')
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('the magic link form sends a link and waits before sending another', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Email' }).fill('  Mark.Reed@RedwoodParts.com ')
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click()

  const sent = page.getByRole('status').filter({ hasText: 'Check your email' })
  await expect(sent).toBeFocused()
  await expect(sent).toContainText(
    'We sent a sign-in link to mark.reed@redwoodparts.com. It works once and expires in 10 minutes.'
  )
  await expect(page.getByRole('button', { name: /^Send again in \d+ s$/ })).toHaveAttribute(
    'aria-disabled',
    'true'
  )

  await page.getByRole('button', { name: 'Use another email' }).click()
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused()
})

test('Google sign in comes back signed in', async ({ page }) => {
  await page.getByRole('button', { name: 'Continue with Google' }).click()

  await expect(page).toHaveURL('/contacts')
  await expect(notices(page).getByText('Signed in as mark.reed@redwoodparts.com.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
})

test('a protected page asks to sign in, then opens', async ({ page }) => {
  await page.goto('/company')
  await expect(page).toHaveURL('/login?next=%2Fcompany')

  await page.getByRole('button', { name: 'Continue with Google' }).click()

  await expect(page).toHaveURL('/company')
  await expect(page.getByRole('heading', { level: 1, name: 'Company' })).toBeVisible()
})
