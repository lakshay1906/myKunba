import { NextRequest, NextResponse } from 'next/server'
import { payload } from '@/payload-client'
import { sendEmail, getSubscriptionConfirmationEmail } from '@/utils/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    // Check if email already exists
    const existingSubscription = await payload.find({
      collection: 'subscriptions',
      where: {
        email: {
          equals: email.toLowerCase().trim(),
        },
      },
      limit: 1,
    })

    // If exists and already subscribed, return success without re-emailing
    if (existingSubscription.docs.length > 0) {
      const subscription = existingSubscription.docs[0]
      if (subscription.subscribed) {
        return NextResponse.json(
          { message: 'You are already subscribed to our newsletter!' },
          { status: 200 },
        )
      }

      // If unsubscribed, re-subscribe them
      await payload.update({
        collection: 'subscriptions',
        id: subscription.id,
        data: {
          subscribed: true,
          unsubscribedAt: null,
        },
      })

      // Send confirmation email
      try {
        await sendEmail({
          to: email,
          subject: 'Welcome Back! You\'re Subscribed to My Kunba',
          html: getSubscriptionConfirmationEmail(email),
        })
      } catch (emailError) {
        console.error('Error sending subscription email:', emailError)
        // Don't fail the request if email fails
      }

      return NextResponse.json(
        { message: 'Successfully re-subscribed to our newsletter!' },
        { status: 200 },
      )
    }

    // Create new subscription
    await payload.create({
      collection: 'subscriptions',
      data: {
        email: email.toLowerCase().trim(),
        subscribed: true,
      },
    })

    // Send confirmation email
    try {
      await sendEmail({
        to: email,
        subject: 'Successfully Subscribed to My Kunba Newsletter',
        html: getSubscriptionConfirmationEmail(email),
      })
    } catch (emailError) {
      console.error('Error sending subscription email:', emailError)
      // Don't fail the request if email fails - subscription is still created
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to our newsletter! Please check your email for confirmation.' },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Error in subscription API:', error)

    // Handle unique constraint violation (email already exists)
    if (error?.data?.name === 'MongoError' && error?.data?.code === 11000) {
      return NextResponse.json(
        { message: 'You are already subscribed to our newsletter!' },
        { status: 200 },
      )
    }

    // Handle duplicate key error for PostgreSQL
    if (error?.message?.includes('duplicate key') || error?.message?.includes('unique constraint')) {
      return NextResponse.json(
        { message: 'You are already subscribed to our newsletter!' },
        { status: 200 },
      )
    }

    return NextResponse.json(
      { message: 'An error occurred while processing your subscription. Please try again later.' },
      { status: 500 },
    )
  }
}
