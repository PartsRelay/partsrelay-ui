import { expect, type Page, test } from '@playwright/test'

const queue = (page: Page) =>
  page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: 'Plate' }) })

const sheet = (page: Page) => page.getByRole('dialog', { name: 'Find the part.' })

const greeting = /^Good (morning|afternoon|evening), Mark Reed\.$/

async function startSearch(page: Page, plate: string, part: string) {
  await page.getByRole('link', { name: 'New search' }).first().click()
  await expect(sheet(page)).toBeVisible()
  await sheet(page).getByRole('textbox', { name: 'Registration plate' }).fill(plate)
  await sheet(page).getByRole('textbox', { name: 'Part needed' }).fill(part)
  await sheet(page).getByRole('button', { name: 'Start search' }).click()
}

async function pick(page: Page, filter: string, option: string) {
  await page.getByRole('combobox', { name: filter }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('as the owner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/searches')
    await expect(page.getByRole('heading', { level: 1, name: greeting })).toBeVisible()
  })

  test('shows the owner the searches of the last 30 days and who searches most', async ({
    page,
  }) => {
    await expect(page.getByText('Searches · last 30 days')).toBeVisible()
    await expect(page.getByText('+200% vs the previous 30 days')).toBeVisible()
    await expect(page.getByText('Completed · last 30 days')).toBeVisible()
    await expect(page.getByText('Failed · last 30 days')).toBeVisible()

    await page.getByRole('link', { name: 'Oakfield Garage' }).click()
    await expect(page).toHaveURL('/searches?searcherType=contact&searcherId=1')
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Oakfield Garage')
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
    await pick(page, 'Requester', 'Oakfield Garage')

    await expect(page).toHaveURL('/searches?searcherType=contact&searcherId=1')
    await expect(page.getByText('7 searches')).toBeVisible()
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Oakfield Garage/)
    }

    await pick(page, 'Requester', 'Elm Street Garage')
    await expect(page.getByText('No searches match the filters')).toBeVisible()

    await page.getByRole('link', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL('/searches')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('filters the searches by status, period and channel together', async ({ page }) => {
    await pick(page, 'Status', 'Done')
    await expect(page).toHaveURL('/searches?status=done')
    await expect(page.getByText('17 searches')).toBeVisible()

    await pick(page, 'Channel', 'WhatsApp')
    await pick(page, 'Period', 'Last 7 days')
    await expect(page).toHaveURL('/searches?status=done&source=whatsapp&days=7')
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Done.*WhatsApp/)
    }

    await pick(page, 'Status', 'All')
    await pick(page, 'Channel', 'All')
    await pick(page, 'Period', 'All time')
    await expect(page).toHaveURL('/searches')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('finds the searches of a plate or a VIN', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Plate or VIN' }).fill('wvwzzz')

    await expect(page).toHaveURL('/searches?search=wvwzzz')
    await expect(page.getByText('5 searches')).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/FT915ZR.*WVWZZZAUZHW204411/)

    await page.getByRole('searchbox', { name: 'Plate or VIN' }).fill('nothing')
    await expect(page.getByText('No searches match the filters')).toBeVisible()
    await page.getByRole('link', { name: 'Clear filters' }).click()
    await expect(page.getByRole('searchbox', { name: 'Plate or VIN' })).toBeEmpty()
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

    await expect(page.getByText('Part requested')).toBeVisible()
    await expect(page.getByText('pastiglie freno anteriori')).toBeVisible()

    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page.getByText('25 searches')).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/CA770NE.*Done.*Mark Reed/)
  })

  test('a plate the catalog does not know offers the same search again', async ({ page }) => {
    await startSearch(page, 'XY123ZZ', 'filtro olio')

    await expect(page.getByRole('heading', { level: 2, name: 'Vehicle not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Search again' }).click()

    await expect(sheet(page).getByRole('textbox', { name: 'Registration plate' })).toHaveValue(
      'XY123ZZ'
    )
    await expect(sheet(page).getByRole('textbox', { name: 'Part needed' })).toHaveValue(
      'filtro olio'
    )
  })

  test('a search by VIN finds the vehicle', async ({ page }) => {
    await page.getByRole('link', { name: 'New search' }).first().click()
    await sheet(page).getByRole('radio', { name: 'VIN' }).click()
    const vin = sheet(page).getByRole('textbox', { name: 'VIN' })
    await vin.fill('WVWZZZAUZHW2044')
    await sheet(page).getByRole('textbox', { name: 'Part needed' }).fill('front brake pads')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()
    await expect(vin).toHaveAccessibleDescription(
      'Check the VIN: 17 letters and digits, without I, O and Q.'
    )

    await vin.fill('wvwzzzauzhw204411')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()

    await expect(page).toHaveURL(/\/searches\/\d+$/)
    await expect(page.getByRole('heading', { level: 2, name: 'WVWZZZAUZHW204411' })).toBeVisible()
    await expect(page.getByText('Volkswagen Golf VII 2.0 TDI')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
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
    await expect(page.getByRole('link', { name: 'Search again' })).toHaveCount(0)
  })

  test('the contacts open the searches of each contact', async ({ page }) => {
    await page.goto('/contacts?page=2')
    await page.getByRole('link', { name: '412 searches by Oakfield Garage' }).click()

    await expect(page).toHaveURL('/searches?searcherType=contact&searcherId=1')
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Oakfield Garage')
  })
})

test.describe('as a viewer', () => {
  test('the stats stay with the owner', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
    await page.goto('/searches')

    await expect(page.getByText('24 searches')).toBeVisible()
    await expect(page.getByText('Searches · last 30 days')).toHaveCount(0)
    await expect(page.getByText('Top searchers')).toHaveCount(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the sections are tabs under the header', async ({ page }) => {
    await page.goto('/searches')
    const tabs = page.getByRole('navigation', { name: 'Sections' })

    await expect(tabs.getByRole('link', { name: 'Searches' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    await tabs.getByRole('link', { name: 'Contacts' }).click()
    await expect(page).toHaveURL('/contacts')
    await expect(tabs.getByRole('link', { name: 'Contacts' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  test('every search shows its status without scrolling sideways', async ({ page }) => {
    await page.goto('/searches')

    await expect(page.getByRole('table')).toBeHidden()
    await expect(page.getByRole('link', { name: /^GH482KL.*Searching$/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
