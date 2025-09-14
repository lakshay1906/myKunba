import Profile from '@/components/profile/Profile'
import { cookies } from 'next/headers'
import { payload } from '@/payload-client'
import jwt from 'jsonwebtoken'

export default async function Page() {
  const token = (await cookies()).get('access_token')?.value
  if (!token || token === '') {
    return <div>You are not authorized.</div>
  }

  const accessSecret = process.env.ACCESS_SECRET
  if (!accessSecret) {
    return <div>Server config error</div>
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

    return <Profile user={data.docs[0]} />
  } catch (error) {
    console.log(error, 'SSR profile fetch error')
    return <div>Error fetching profile</div>
  }
}
