import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export function verifyToken(token: string, secret: string) {
  try {
    const decoded = jwt.verify(token, secret)
    return decoded
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function getTokenFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  return token || null
}
