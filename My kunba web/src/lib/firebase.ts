// Import the functions you need from the SDKs you need
import type { FirebaseApp } from 'firebase/app'
import { initializeApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import { getAuth } from 'firebase/auth'

// Lazy init: avoid running Firebase during SSG/Docker build (no window, invalid API key).
// Only initialize in the browser when auth is first used.
const firebaseConfig =
  process.env.NODE_ENV === 'production'
    ? {
        apiKey: 'AIzaSyC4WN-I24Eotzv5dvhyqblYG_hMb0MZ7bc',
        authDomain: 'my-kunba.firebaseapp.com',
        projectId: 'my-kunba',
        storageBucket: 'my-kunba.firebasestorage.app',
        messagingSenderId: '436194971066',
        appId: '1:436194971066:web:a2a7bf548daa55ca162183',
        measurementId: 'G-94FD9JL7PP',
      }
    : {
        apiKey: 'AIzaSyAT3elw81dDTTR1rntJPJJnTrxkGmoqEG0',
        authDomain: 'my-kunba-dev.firebaseapp.com',
        projectId: 'my-kunba-dev',
        storageBucket: 'my-kunba-dev.firebasestorage.app',
        messagingSenderId: '49573406677',
        appId: '1:49573406677:web:bc32cbec1a650dc8697f5c',
      }

let app: FirebaseApp | null = null
let authInstance: Auth | null = null

/**
 * Returns Firebase Auth instance, or null if not in browser or init failed (e.g. during build).
 * Use this instead of importing `auth` so static pages can prerender without initializing Firebase.
 */
export function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null
  if (authInstance) return authInstance
  try {
    if (!app) app = initializeApp(firebaseConfig)
    authInstance = getAuth(app)
    return authInstance
  } catch {
    return null
  }
}

