import { createFormHookContexts } from '@tanstack/react-form'

// Own file, so the shared components avoid importing form.ts
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
