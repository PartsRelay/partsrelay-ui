import { expect, type Page, test } from '@playwright/test'

const queue = (page: Page) =>
  page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Plate' }) })

const sheet = (page: Page) => page.getByRole('dialog', { name: 'Find the part.' })

async function startSearch(page: Page, plate: string, part: string) {
  await page.getByRole('link', { name: 'New search' }).first().click()
  await expect(sheet(page)).toBeVisible()
  await sheet(page).getByRole('textbox', { name: 'Registration plate' }).fill(plate)
  await sheet(page).getByRole('textbox', { name: 'Part needed' }).fill(part)
  await sheet(page).getByRole('button', { name: 'Start search' }).click()
}

test.describe('as the owner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/searches')
    await expect(page.getByRole('heading', { level: 1, name: 'Searches' })).toBeVisible()
  })

  test('shows the searches of the company, newest first, by page', async ({ page }) => {
    await expect(page.getByText('24 searches')).toBeVisible()
    await expect(queue(page).getByRole('row')).toHaveCount(21)
    await expect(queue(page).getByRole('row').nth(1)).toContainText(
      /GH482KL.*Searching.*Web.*Julia Bennett/
    )
    await expect(queue(page).getByRole('row').nth(2)).toContainText(
      /FT915ZR.*Oil filter.*Volkswagen Golf VII 2\.0 TDI.*Done.*WhatsApp.*Oakfield Garage/
    )

    await page.getByRole('link', { name: 'Next' }).click()
    await expect(page).toHaveURL('/searches?page=2')
    await expect(queue(page).getByRole('row')).toHaveCount(5)
  })

  test('filters the searches by requester', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Requester' }).click()
    await page.getByRole('option', { name: 'Oakfield Garage' }).click()

    await expect(page).toHaveURL('/searches?searcherType=contact&searcherId=1')
    await expect(page.getByText('7 searches')).toBeVisible()
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Oakfield Garage/)
    }

    await page.getByRole('combobox', { name: 'Requester' }).click()
    await page.getByRole('option', { name: 'Elm Street Garage' }).click()
    await expect(page.getByText('No searches from this requester')).toBeVisible()

    await page.getByRole('link', { name: 'Clear the filter' }).click()
    await expect(page).toHaveURL('/searches')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('a new search needs a plate and the part, like the core', async ({ page }) => {
    await page.getByRole('link', { name: 'New search' }).first().click()
    await expect(page).toHaveURL('/searches?new=true')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()

    const plate = sheet(page).getByRole('textbox', { name: 'Registration plate' })
    const part = sheet(page).getByRole('textbox', { name: 'Part needed' })
    await expect(plate).toBeFocused()
    await expect(plate).toHaveAccessibleDescription('Enter the registration plate.')
    await expect(part).toHaveAccessibleDescription(
      'Enter the part you need, such as front brake pads.'
    )
    await expect(plate).toHaveAttribute('maxlength', '255')
    await expect(part).toHaveAttribute('maxlength', '200')

    await plate.fill('CA 7')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()
    await expect(plate).toHaveAccessibleDescription('Check the plate: 4 to 8 letters and digits.')

    await page.goBack()
    await expect(sheet(page)).toBeHidden()
    await expect(page).toHaveURL('/searches')
  })

  test('closing a new search puts the focus back on its link', async ({ page }) => {
    const open = page.getByRole('link', { name: 'New search' }).first()
    await open.focus()
    await page.keyboard.press('Enter')
    await expect(sheet(page)).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(sheet(page)).toBeHidden()
    await expect(open).toBeFocused()
  })

  test('a new search opens its result', async ({ page }) => {
    await startSearch(page, 'ca 770-ne', 'pastiglie freno anteriori')

    await expect(page).toHaveURL(/\/searches\/\d+$/)
    await expect(page.getByRole('heading', { level: 2, name: 'CA770NE' })).toBeVisible()
    await expect(page.getByText('Fiat Panda 1.2')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
    await expect(page.getByText('OE 77367141')).toBeVisible()
    await expect(page.getByText('P 23 141')).toBeVisible()

    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page.getByText('25 searches')).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/CA770NE.*Done.*Mark Reed/)
  })

  test('a plate the catalog does not know offers a new search', async ({ page }) => {
    await startSearch(page, 'XY123ZZ', 'filtro olio')

    await expect(page.getByRole('heading', { level: 2, name: 'Vehicle not found' })).toBeVisible()
    await page.getByRole('link', { name: 'New search with this plate' }).click()

    await expect(page).toHaveURL('/searches?new=true&plate=XY123ZZ')
    await expect(sheet(page).getByRole('textbox', { name: 'Registration plate' })).toHaveValue(
      'XY123ZZ'
    )
    await expect(sheet(page).getByRole('textbox', { name: 'Part needed' })).toBeEmpty()
  })

  test('a search that does not exist says so', async ({ page }) => {
    await page.goto('/searches/9999')

    await expect(page.getByText('The requested item does not exist.')).toBeVisible()
  })

  test('a running search says it is still searching', async ({ page }) => {
    await queue(page).getByRole('link', { name: 'Open the search of GH482KL' }).first().click()

    await expect(
      page.getByRole('heading', { level: 2, name: 'Searching the catalog' })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'New search with this plate' })).toHaveCount(0)
  })

  test('the contacts open the searches of each contact', async ({ page }) => {
    await page.goto('/contacts?page=2')
    await page.getByRole('link', { name: '412 searches by Oakfield Garage' }).click()

    await expect(page).toHaveURL('/searches?searcherType=contact&searcherId=1')
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Oakfield Garage')
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('every search shows its status without scrolling sideways', async ({ page }) => {
    await page.goto('/searches')

    await expect(page.getByRole('table')).toBeHidden()
    await expect(page.getByRole('link', { name: /^GH482KL.*Searching$/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
