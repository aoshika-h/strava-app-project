import type { NextRequest } from 'next/server'
import { handleCallback } from '@/controllers/authController'

export function GET(request: NextRequest) {
  return handleCallback(request)
}
