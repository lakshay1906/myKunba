import Profile from '@/components/profile/Profile'
import { cookies } from 'next/headers'
import { payload } from '@/payload-client'
import jwt from 'jsonwebtoken'
import { redirect } from 'next/navigation'

export default async function Page() {
  const token = (await cookies()).get('access_token')?.value
  if (!token || token === '') {
    redirect('/unauthorised')
  }

  const accessSecret = process.env.ACCESS_SECRET
  if (!accessSecret) {
    redirect('/unauthorised')
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
      redirect('/unauthorised')
    }

    return <Profile user={data.docs[0]} />
  } catch (error) {
    redirect('/unauthorised')
  }
}
