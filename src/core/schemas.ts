import { z } from 'zod'

export const requiredText = (key: string) => z.string().trim().min(1, key)
