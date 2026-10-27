import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/contacts')
  await expect(page.getByRole('heading', { level: 1, name: 'Contacts' })).toBeVisible()
})

test('shows the number workshops write to and its link', async ({ page }) => {
  await expect(page.getByText('+39 02 8734 1190')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open chat' })).toHaveAttribute(
    'href',
    'https://wa.me/390287341190'
  )
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible()
})

test('finds contacts by name or number, also within a tab', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Search' })

  await search.fill('oak')
  await expect(page).toHaveURL('/contacts?search=oak')
  await expect(page.getByText('1 contact', { exact: true })).toBeVisible()
  await expect(page.getByRole('row', { name: /Oakfield Garage/ })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Joined' })).toBeVisible()

  await search.fill('900105')
  await expect(page.getByText('1 contact', { exact: true })).toBeVisible()
  await expect(page.getByRole('row', { name: /Quick Fit Tyres/ })).toBeVisible()

  await page.getByRole('tab', { name: 'Active' }).click()
  await expect(page).toHaveURL(/\/contacts\?search=.*900105.*&status=active$/)
  await expect(page.getByText('No contacts match the search')).toBeVisible()
})
