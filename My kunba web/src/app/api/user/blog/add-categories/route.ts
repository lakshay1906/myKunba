import { payload } from '@/payload-client'
import { NextRequest, NextResponse } from 'next/server.js'

export async function GET(req: NextRequest) {
  try {
    const drizzle = payload.db.drizzle
    const usersTable = payload.db.tables.users

    const data = await drizzle.select().from(usersTable)
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(){
  try {
    
  } catch (error) {
    
  }
}
