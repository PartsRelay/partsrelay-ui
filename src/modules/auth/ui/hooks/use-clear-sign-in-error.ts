import { useNavigate } from '@tanstack/react-router'

export function useClearSignInError() {
  const navigate = useNavigate()

  return () =>
    navigate({ to: '.', search: (search) => ({ ...search, error: undefined }), replace: true })
}
