import type { ComponentProps } from 'react'
import { useFormContext } from '@/form-context'

// Submits the form state, then focuses the first invalid field
export function Form(props: Omit<ComponentProps<'form'>, 'noValidate' | 'onSubmit'>) {
  const form = useFormContext()

  return (
    <form
      {...props}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault()
        if (form.state.isSubmitting) return

        const element = event.currentTarget
        await form.handleSubmit()
        const [name] = Object.keys(form.getAllErrors().fields)
        const control = name ? element.elements.namedItem(name) : null
        if (control instanceof HTMLElement) control.focus()
      }}
    />
  )
}
