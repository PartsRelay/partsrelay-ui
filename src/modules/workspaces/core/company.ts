import { message } from '@/core/message'
import { createCleanForm } from '@/core/cleaner'

export function createCompanyNameForm(current: string) {
  return createCleanForm(current, message('company.errors.name-required'))
}
