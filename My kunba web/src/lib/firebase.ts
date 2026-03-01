// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// const analytics = getAnalytics(app);
export const auth = getAuth(app)
