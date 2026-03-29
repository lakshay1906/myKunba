'use client'

export default function page() {

    const abc = {
        DATABASE_URI: process.env.DATABASE_URI,
        PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
        NEXT_PUBLIC_NEXT_URL: process.env.NEXT_PUBLIC_NEXT_URL,
        NEXT_PUBLIC_PUBLIC_URL: process.env.NEXT_PUBLIC_PUBLIC_URL,
        ACCESS_SECRET: process.env.ACCESS_SECRET,
        NEXT_PUBLIC_ACCESS_SECRET: process.env.NEXT_PUBLIC_ACCESS_SECRET,
        NEXT_PUBLIC_ADSENSE_ID: process.env.NEXT_PUBLIC_ADSENSE_ID,
        NEXT_PUBLIC_ADS_SLOT_1: process.env.NEXT_PUBLIC_ADS_SLOT_1,
        NEXT_PUBLIC_ADS_SLOT_2: process.env.NEXT_PUBLIC_ADS_SLOT_2,
        NEXT_PUBLIC_ADS_SLOT_3: process.env.NEXT_PUBLIC_ADS_SLOT_3,
        NEXT_PUBLIC_ADS_SLOT_4: process.env.NEXT_PUBLIC_ADS_SLOT_4,
        NEXT_PUBLIC_GA_PROPERTY_ID: process.env.NEXT_PUBLIC_GA_PROPERTY_ID,
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_BUCKET_NAME: process.env.CLOUDFLARE_BUCKET_NAME,
        CLOUDFLARE_ACCESS_ID: process.env.CLOUDFLARE_ACCESS_ID,
        CLOUDFLARE_SECRET_KEY: process.env.CLOUDFLARE_SECRET_KEY,
        CLOUDFLARE_PUBLIC_URL: process.env.CLOUDFLARE_PUBLIC_URL,
        CLOUDFLARE_S3_API: process.env.CLOUDFLARE_S3_API,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_EMAIL: process.env.SMTP_EMAIL,
        SMTP_PASS: process.env.SMTP_PASS,
        NODE_ENV: process.env.NODE_ENV,
        GA_PROPERTY_ID: process.env.GA_PROPERTY_ID,
    }

    console.log(abc)
    return (
        <div>page</div>
    )
}