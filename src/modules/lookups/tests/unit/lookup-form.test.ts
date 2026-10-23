import { describe, expect, it } from 'vite-plus/test'
import {
  compactPlate,
  emptyLookup,
  newLookup,
  plateError,
  queryError,
} from '@/modules/lookups/core/lookup-form'

const plate = (value: string) => plateError({ value })

const query = (value: string) => queryError({ value })

describe('new search form', () => {
  it('starts empty, or with the plate of a previous search', () => {
    expect(emptyLookup()).toEqual({ plate: '', query: '' })
    expect(emptyLookup('CA770NE')).toEqual({ plate: 'CA770NE', query: '' })
  })

  it('reads plates like the core, without spaces, dots and dashes', () => {
    expect(compactPlate(' ca 770-ne ')).toBe('CA770NE')
    expect(compactPlate('ab.123.cd')).toBe('AB123CD')
  })

  it('asks for a plate of 4 to 8 letters and digits', () => {
    expect(plate('  ')).toBe('lookups.new.errors.plate-required')
    expect(plate('ca 770 ne')).toBeUndefined()
    expect(plate('AB12')).toBeUndefined()
    expect(plate('AB1')).toBe('lookups.new.errors.plate')
    expect(plate('AB1234567')).toBe('lookups.new.errors.plate')
    expect(plate('AB_123')).toBe('lookups.new.errors.plate')
  })

  it('asks for the part in 2 to 200 characters', () => {
    expect(query(' ')).toBe('lookups.new.errors.query-required')
    expect(query(' a ')).toBe('lookups.new.errors.query')
    expect(query('ab')).toBeUndefined()
    expect(query('a'.repeat(200))).toBeUndefined()
    expect(query('a'.repeat(201))).toBe('lookups.new.errors.query')
  })

  it('sends the compact plate and the trimmed part as free text', () => {
    expect(newLookup({ plate: 'ca 770-ne', query: '  filtro olio ' })).toEqual({
      plate: 'CA770NE',
      query: 'filtro olio',
    })
  })
})
