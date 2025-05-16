// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyC4WN-I24Eotzv5dvhyqblYG_hMb0MZ7bc',
  authDomain: 'my-kunba.firebaseapp.com',
  projectId: 'my-kunba',
  storageBucket: 'my-kunba.firebasestorage.app',
  messagingSenderId: '436194971066',
  appId: '1:436194971066:web:a2a7bf548daa55ca162183',
  measurementId: 'G-94FD9JL7PP',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const db = getFirestore(app)
