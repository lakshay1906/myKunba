'use client'

import { createContext, useContext, useState, ReactNode, SetStateAction, useEffect } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { auth } from '../firebase'

type AppContextType = {
  loginDetail: null | {
    token: string
    email: string
    uid: string
    profile_pic: string
    name: string
    role?: string | null
  }
  setLoginDetail: React.Dispatch<
    SetStateAction<{
      token: string
      email: string
      uid: string
      profile_pic: string
      name: string
      role?: string | null
    } | null>
  >
  logout: () => Promise<void>
  googleSignIn: () => Promise<User>
  loading: boolean
  setLoading: React.Dispatch<SetStateAction<boolean>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ token, children }: { token: string | null; children: ReactNode }) => {
  const [loginDetail, setLoginDetail] = useState<null | {
    token: string
    email: string
    uid: string
    profile_pic: string
    name: string
    role?: string | null
  }>(null)
  const [loading, setLoading] = useState(false)

  async function googleSignIn() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  async function logout() {
    await signOut(auth)
      .then(() => {
        setLoginDetail(null)
      })
      .catch((error) => {
        console.error('Error signing out:', error)
      })
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // if (user)
      //   setLoginDetail((prev) => ({
      //     ...prev,
      //     email: user.email ?? '',
      //     name: user.displayName ?? '',
      //     profile_pic: user.photoURL ?? '',
      //     token: prev?.token ?? '',
      //     uid: user.uid,
      //   }))
      // else setLoginDetail(null)
      console.log(user)
    })
    return () => {
      unsubscribe
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!token) return
      const rawRes = await fetch(`/api/jwt/verify`, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
        },
      })
      if (rawRes.ok) {
        const res = await rawRes.json()
        setLoginDetail({
          token: token,
          email: res.email,
          name: res.name,
          profile_pic: res.profile_pic,
          uid: res.uid,
          role: null,
        })
      }
    })()
  }, [])

  useEffect(() => {
    console.log(loginDetail)
  }, [loginDetail])

  return (
    <AppContext.Provider
      value={{
        loginDetail,
        setLoginDetail,
        logout,
        googleSignIn,
        loading,
        setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useAppStore = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}
