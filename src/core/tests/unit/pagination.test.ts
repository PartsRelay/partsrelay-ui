import { describe, expect, it } from 'vite-plus/test'
import { message } from '@/core/message'
import { pageInfo } from '@/core/pagination'

// The metadata the core sends for a page
function metadata(currentPage: number, perPage: number, total: number) {
  return { total, perPage, currentPage, lastPage: Math.max(1, Math.ceil(total / perPage)) }
}

describe('pagination', () => {
  it('tells the shown range and the pages around it', () => {
    const second = pageInfo(metadata(2, 20, 45))

    expect(second).toMatchObject({ from: 21, to: 40, page: 2, pages: 3, outOfRange: false })
    expect(second).toMatchObject({ hasPrevious: true, hasNext: true })
    expect(second.range).toEqual(message('pagination.range', { from: 21, to: 40, total: 45 }))
    expect(pageInfo(metadata(3, 20, 45))).toMatchObject({ to: 45, hasNext: false })
  })

  it('notices a page past the end and an empty list', () => {
    expect(pageInfo(metadata(4, 20, 45)).outOfRange).toBe(true)
    expect(pageInfo(metadata(1, 20, 0))).toMatchObject({
      from: 0,
      to: 0,
      pages: 1,
      outOfRange: false,
    })
  })
})
