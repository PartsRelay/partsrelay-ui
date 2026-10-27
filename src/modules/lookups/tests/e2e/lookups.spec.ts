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
    await page.goto('/lookups')
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
    await expect(page).toHaveURL('/lookups?searcherType=contact&searcherId=1')
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
    await expect(page).toHaveURL('/lookups?page=2')
    await expect(queue(page).getByRole('row')).toHaveCount(5)
  })

  test('filters the searches by requester', async ({ page }) => {
    await pick(page, 'Requester', 'Oakfield Garage')

    await expect(page).toHaveURL('/lookups?searcherType=contact&searcherId=1')
    await expect(page.getByText('7 searches')).toBeVisible()
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Oakfield Garage/)
    }

    await pick(page, 'Requester', 'Elm Street Garage')
    await expect(page.getByText('No searches match the filters')).toBeVisible()

    await page.getByRole('link', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL('/lookups')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('filters the searches by status, period and channel together', async ({ page }) => {
    await pick(page, 'Status', 'Done')
    await expect(page).toHaveURL('/lookups?status=done')
    await expect(page.getByText('17 searches')).toBeVisible()

    await pick(page, 'Channel', 'WhatsApp')
    await pick(page, 'Period', 'Last 7 days')
    await expect(page).toHaveURL('/lookups?status=done&source=whatsapp&days=7')
    await expect(page.getByText('4 searches', { exact: true })).toBeVisible()
    for (const row of await queue(page).getByRole('row').all()) {
      await expect(row).toContainText(/Requester|Done.*WhatsApp/)
    }

    await pick(page, 'Status', 'All')
    await pick(page, 'Channel', 'All')
    await pick(page, 'Period', 'All time')
    await expect(page).toHaveURL('/lookups')
    await expect(page.getByText('24 searches')).toBeVisible()
  })

  test('goes back to the queue with its filters', async ({ page }) => {
    await pick(page, 'Status', 'Done')
    await expect(page).toHaveURL('/lookups?status=done')
    await queue(page).getByRole('link', { name: 'Open the search of FT915ZR' }).first().click()
    await expect(page).toHaveURL(/\/lookups\/\d+$/)

    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page).toHaveURL('/lookups?status=done')
    await expect(page.getByText('17 searches')).toBeVisible()
  })

  test('finds the searches of a plate or a VIN', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Plate or VIN' }).fill('wvwzzz')

    await expect(page).toHaveURL('/lookups?search=wvwzzz')
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
    await expect(page).toHaveURL('/lookups?new=true')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()

    const plate = sheet(page).getByRole('textbox', { name: 'Registration plate' })
    const part = sheet(page).getByRole('textbox', { name: 'Part needed' })
    await expect(plate).toBeFocused()
    await expect(plate).toHaveAccessibleDescription('Enter the registration plate.')
    await expect(part).toHaveAccessibleDescription(
      'Enter the part you need, such as front brake pads.'
    )
    await expect(part).not.toHaveAttribute('maxlength')

    await plate.fill('CA 7')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()
    await expect(plate).toHaveAccessibleDescription('Check the plate: 4 to 8 letters and digits.')

    await page.goBack()
    await expect(sheet(page)).toBeHidden()
    await expect(page).toHaveURL('/lookups')
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
    await startSearch(page, 'ab 123-cd', 'pastiglie freno anteriori')

    await expect(page).toHaveURL(/\/lookups\/\d+$/)
    await expect(page.getByRole('heading', { level: 2, name: 'AB123CD' })).toBeVisible()
    await expect(page.getByText('Fiat Panda 1.2')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
    await expect(page.getByText('3 original parts · 4 aftermarket matches')).toBeVisible()
    await expect(page.getByText('Part requested')).toBeVisible()
    await expect(page.getByText('pastiglie freno anteriori')).toBeVisible()

    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page.getByText('25 searches')).toBeVisible()
    await expect(queue(page).getByRole('row').nth(1)).toContainText(/AB123CD.*Done.*Mark Reed/)
  })

  test('the result lists each unit of the catalog with its code, view and positions', async ({
    page,
  }) => {
    await startSearch(page, 'AB123CD', 'front brake pads')
    const part = (code: string) => page.getByRole('listitem').filter({ hasText: `OE ${code}` })

    await expect(page.getByRole('heading', { level: 3, name: '50110 Front brakes' })).toBeVisible()
    await expect(part('77367141')).toContainText('Pos. 4')
    await expect(part('77367141')).toContainText(/BREMBO.*P 23 141/)

    await expect(
      page.getByRole('heading', { level: 3, name: '50112 Front brake caliper' })
    ).toBeVisible()
    await expect(part('77365620')).toContainText(/Pos\. 6.*Brake pad fitting kit.*TRW.*PFK543/)
    await expect(part('46402682')).toContainText(/Pos\. 7.*Pad retaining spring/)
    await expect(part('46402682')).toContainText('No aftermarket matches.')

    const view = page.getByRole('link', { name: 'Exploded view of Front brake caliper' })
    const thumbnail = view.getByRole('img')
    await expect(view).toHaveAttribute('href', /\/exploded-view\.svg\?.*size=source$/)
    await expect(thumbnail).toHaveAttribute('src', /\/exploded-view\.svg\?.*size=250$/)
    await thumbnail.scrollIntoViewIfNeeded()
    await expect
      .poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0)

    const popup = page.waitForEvent('popup')
    await view.click()
    await expect(await popup).toHaveURL(/\/exploded-view\.svg\?.*size=source$/)
  })

  test('a category without parts for the vehicle says so', async ({ page }) => {
    await startSearch(page, 'AB123CD', 'filtro abitacolo')

    await expect(page.getByRole('heading', { level: 2, name: 'Cabin filter' })).toBeVisible()
    await expect(page.getByText('0 original parts · 0 aftermarket matches')).toBeVisible()
    await expect(page.getByText('No parts found for this vehicle in this category.')).toBeVisible()
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
    const plate = sheet(page).getByRole('textbox', { name: 'Registration plate' })
    await plate.fill('XX')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()
    await expect(plate).toHaveAccessibleDescription('Check the plate: 4 to 8 letters and digits.')

    await sheet(page).getByRole('radio', { name: 'VIN' }).click()
    const vin = sheet(page).getByRole('textbox', { name: 'VIN' })
    await expect(vin).toBeEmpty()
    await expect(vin).toHaveAccessibleDescription('17 letters and digits, without I, O and Q.')
    await vin.fill('WVWZZZAUZHW2044')
    await sheet(page).getByRole('textbox', { name: 'Part needed' }).fill('front brake pads')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()
    await expect(vin).toHaveAccessibleDescription(
      'Check the VIN: 17 letters and digits, without I, O and Q.'
    )

    await vin.fill('wvwzzzauzhw204411')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()

    await expect(page).toHaveURL(/\/lookups\/\d+$/)
    await expect(page.getByRole('heading', { level: 2, name: 'WVWZZZAUZHW204411' })).toBeVisible()
    await expect(page.getByText('Volkswagen Golf VII 2.0 TDI')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Front brake pads' })).toBeVisible()
  })

  test('a VIN the catalog does not know says the vehicle was not identified', async ({ page }) => {
    await page.getByRole('link', { name: 'New search' }).first().click()
    await sheet(page).getByRole('radio', { name: 'VIN' }).click()
    await sheet(page).getByRole('textbox', { name: 'VIN' }).fill('ZFA31200000000000')
    await sheet(page).getByRole('textbox', { name: 'Part needed' }).fill('oil filter')
    await sheet(page).getByRole('button', { name: 'Start search' }).click()

    await expect(page.getByRole('heading', { level: 2, name: 'Vehicle not found' })).toBeVisible()
    await expect(page.getByText('Vehicle not identified')).toBeVisible()
    await expect(page.getByText('VIN', { exact: true })).toBeHidden()
  })

  test('a search that does not exist says so', async ({ page }) => {
    await page.goto('/lookups/9999')

    await expect(page.getByRole('heading', { level: 2, name: 'Page not found' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeHidden()
    await page.getByRole('link', { name: 'Back to searches' }).click()
    await expect(page).toHaveURL('/lookups')
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

    await expect(page).toHaveURL('/lookups?searcherType=contact&searcherId=1')
    await expect(page.getByRole('combobox', { name: 'Requester' })).toHaveText('Oakfield Garage')
  })
})

test.describe('as a viewer', () => {
  test('the stats stay with the owner', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock.user', 'viewer'))
    await page.goto('/lookups')
    await expect(page.getByRole('heading', { level: 1, name: /Sarah Collins/ })).toBeVisible()

    await expect(page.getByText('24 searches')).toBeVisible()
    await expect(page.getByText('Searches · last 30 days')).toHaveCount(0)
    await expect(page.getByText('Top searchers')).toHaveCount(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the sections are tabs under the header', async ({ page }) => {
    await page.goto('/lookups')
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
    await page.goto('/lookups')

    await expect(page.getByRole('table')).toBeHidden()
    await expect(page.getByRole('link', { name: /^GH482KL.*Searching$/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
})
