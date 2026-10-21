import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { Form } from '@/ui/components/form'
import { InputField } from '@/ui/components/input-field'
import { SubmitButton } from '@/ui/components/submit-button'

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts()

export { useFieldContext, useFormContext }

// Every form of the app is built with useAppForm
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { InputField },
  formComponents: { Form, SubmitButton },
})

// Trimmed text is required, the error is a translation key
export function requiredText(key: string) {
  return ({ value }: { value: string }) => (value.trim() ? undefined : key)
}
