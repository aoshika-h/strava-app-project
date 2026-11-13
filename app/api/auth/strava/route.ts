import type { NextRequest } from 'next/server'
import { startAuthorization } from '@/controllers/authController'

export function GET(request: NextRequest) {
  return startAuthorization(request)
}
