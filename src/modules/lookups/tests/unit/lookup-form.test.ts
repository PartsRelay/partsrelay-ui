import { describe, expect, it } from 'vite-plus/test'
import type { z } from 'zod'
import {
  compactIdentifier,
  emptyLookup,
  identifierSchemas,
  lookupFieldErrors,
  newLookup,
  querySchema,
} from '@/modules/lookups/core/lookup-form'
import { coreError } from '@/modules/contacts/tests/unit/fixtures'

const error = (schema: z.ZodType) => (value: string) =>
  schema.safeParse(value).error?.issues[0]?.message

const plate = error(identifierSchemas.plate)

const vin = error(identifierSchemas.vin)

const query = error(querySchema)

describe('new search form', () => {
  it('starts empty, or with the plate or VIN and the part of a previous search', () => {
    expect(emptyLookup()).toEqual({ by: 'plate', plate: '', vin: '', query: '' })
    expect(emptyLookup({ plate: 'CA770NE', query: 'Oil filter' })).toEqual({
      by: 'plate',
      plate: 'CA770NE',
      vin: '',
      query: 'Oil filter',
    })
    expect(emptyLookup({ vin: 'WVWZZZAUZHW204411' })).toEqual({
      by: 'vin',
      plate: '',
      vin: 'WVWZZZAUZHW204411',
      query: '',
    })
  })

  it('reads plates and VINs like the core, without spaces, dots and dashes', () => {
    expect(compactIdentifier(' ca 770-ne ')).toBe('CA770NE')
    expect(compactIdentifier('ab.123.cd')).toBe('AB123CD')
  })

  it('asks for a plate of 4 to 8 letters and digits', () => {
    expect(plate('  ')).toBe('lookups.new.errors.plate-required')
    expect(plate('ca 770 ne')).toBeUndefined()
    expect(plate('AB12')).toBeUndefined()
    expect(plate('AB1')).toBe('lookups.new.errors.plate')
    expect(plate('AB1234567')).toBe('lookups.new.errors.plate')
    expect(plate('AB_123')).toBe('lookups.new.errors.plate')
  })

  it('asks for a VIN of 17 letters and digits without I, O and Q', () => {
    expect(vin(' ')).toBe('lookups.new.errors.vin-required')
    expect(vin('wvwzzzauzhw204411')).toBeUndefined()
    expect(vin('WVWZZZAUZHW20441')).toBe('lookups.new.errors.vin')
    expect(vin('WVWZZZAUZHW20441O')).toBe('lookups.new.errors.vin')
  })

  it('asks for the part in 2 to 200 characters', () => {
    expect(query(' ')).toBe('lookups.new.errors.query-required')
    expect(query(' a ')).toBe('lookups.new.errors.query')
    expect(query('ab')).toBeUndefined()
    expect(query('a'.repeat(200))).toBeUndefined()
    expect(query('a'.repeat(201))).toBe('lookups.new.errors.query')
  })

  it('shows each error of the core under the field it names', () => {
    const plateAndQuery = coreError(422, 'validation-error', [
      { field: 'plate', rule: 'plate' },
      { field: 'query', rule: 'maxLength' },
    ])
    const vinOnly = coreError(422, 'validation-error', [{ field: 'vin', rule: 'regex' }])

    expect(lookupFieldErrors(plateAndQuery)).toEqual({
      plate: 'lookups.new.errors.plate',
      query: 'lookups.new.errors.query',
    })
    expect(lookupFieldErrors(vinOnly)).toEqual({ vin: 'lookups.new.errors.vin' })
    expect(lookupFieldErrors(coreError(404, 'row-not-found'))).toBeNull()
  })

  it('sends the compact plate or VIN and the trimmed part as free text', () => {
    const values = { plate: 'ca 770-ne', vin: 'wvwzzzauzhw204411', query: '  filtro olio ' }

    expect(newLookup({ ...values, by: 'plate' })).toEqual({
      plate: 'CA770NE',
      query: 'filtro olio',
    })
    expect(newLookup({ ...values, by: 'vin', query: 'oil' })).toEqual({
      vin: 'WVWZZZAUZHW204411',
      query: 'oil',
    })
  })
})
