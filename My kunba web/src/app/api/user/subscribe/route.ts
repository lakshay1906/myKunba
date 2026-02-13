import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/payload-client'
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

    // Get payload client
    const payload = await getPayloadClient()

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
      let emailError: any = null
      try {
        await sendEmail({
          to: email,
          subject: 'Welcome Back! You\'re Subscribed to My Kunba',
          html: getSubscriptionConfirmationEmail(email),
        })
      } catch (err) {
        emailError = err
        const errObj = err as { message?: string; code?: string }
        console.error('Error sending subscription email:', {
          message: errObj?.message,
          code: errObj?.code,
        })
        // Don't fail the request if email fails - subscription is still created
      }

      return NextResponse.json(
        {
          message: 'Successfully re-subscribed to our newsletter!',
          ...(emailError && {
            warning: 'Subscription successful, but confirmation email could not be sent. Please contact support if you don\'t receive updates.',
            ...(process.env.NODE_ENV === 'development' && {
              debug: (emailError as { message?: string })?.message || String(emailError),
            }),
          }),
        },
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
    let emailError: any = null
    try {
      await sendEmail({
        to: email,
        subject: 'Successfully Subscribed to My Kunba Newsletter',
        html: getSubscriptionConfirmationEmail(email),
      })
    } catch (err) {
      emailError = err
      const errObj = err as { message?: string; code?: string }
      console.error('Error sending subscription email:', {
        message: errObj?.message,
        code: errObj?.code,
      })
      // Don't fail the request if email fails - subscription is still created
    }

    return NextResponse.json(
      {
        message: 'Successfully subscribed to our newsletter! Please check your email for confirmation.',
        ...(emailError && {
          warning: 'Subscription successful, but confirmation email could not be sent. Please contact support if you don\'t receive updates.',
          ...(process.env.NODE_ENV === 'development' && {
            debug: (emailError as { message?: string })?.message || String(emailError),
          }),
        }),
      },
      { status: 200 },
    )
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error('Error in subscription API:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      data: error?.data,
      code: error?.code,
      status: error?.status,
      errors: error?.errors,
      fullError: error,
    })

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

    // Handle Payload collection not found error
    if (
      error?.message?.includes('collection') ||
      error?.message?.includes('not found') ||
      error?.message?.includes('does not exist')
    ) {
      console.error(
        'Subscription collection might not exist. Please ensure the database migration has been run.',
      )
      return NextResponse.json(
        {
          message: 'Subscription service is not available. Please contact support.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 503 },
      )
    }

    // Handle database connection errors
    if (
      error?.message?.includes('connection') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNREFUSED')
    ) {
      console.error('Database connection error:', error.message)
      return NextResponse.json(
        { message: 'Database connection failed. Please try again later.' },
        { status: 503 },
      )
    }

    // Generic error response with detailed message in development
    return NextResponse.json(
      {
        message: 'An error occurred while processing your subscription. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
