import type { AnyFormApi } from '@tanstack/react-form'
import type { ComponentProps } from 'react'

type FormProps = Omit<ComponentProps<'form'>, 'noValidate' | 'onSubmit'> & { form: AnyFormApi }

export function Form({ form, ...props }: FormProps) {
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
