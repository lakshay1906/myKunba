import Profile from '@/components/profile/Profile'
import { cookies } from 'next/headers'

// Private: always SSR so authors see real-time data
export const dynamic = 'force-dynamic'
import { payload } from '@/payload-client'
import jwt from 'jsonwebtoken'
import { redirect } from 'next/navigation'
import { parseSocialLinks } from '@/lib/utils'

function profileUnauthorised(): never {
  redirect('/unauthorised?redirect=' + encodeURIComponent('/profile'))
}

export default async function Page() {
  const token = (await cookies()).get('access_token')?.value
  if (!token || token === '') {
    return profileUnauthorised()
  }

  const accessSecret = process.env.ACCESS_SECRET
  if (!accessSecret) {
    return profileUnauthorised()
  }

  try {
    const jwtData: any = jwt.verify(token, accessSecret)

    const data = await payload.find({
      collection: 'users',
      where: {
        uid: { equals: jwtData.uid },
        email: { equals: jwtData.email },
        deleted_at: { equals: null },
      },
    })

    if (!data.docs || data.docs.length === 0) {
      return profileUnauthorised()
    }

    const user = data.docs[0] as unknown as Record<string, unknown>
    const normalizedUser = {
      ...user,
      socialLinks: parseSocialLinks(
        user.socialLinks as string | { platform?: string | null; url?: string | null }[] | null | undefined,
      ),
    }
    return <Profile user={normalizedUser} />
  } catch (error) {
    return profileUnauthorised()
  }
}
