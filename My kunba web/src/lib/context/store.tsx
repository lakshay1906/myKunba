'use client'

import { createContext, useContext, useState, ReactNode, SetStateAction, useEffect } from 'react'
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
} from 'firebase/auth'
import { auth } from '../firebase'

type AppContextType = {
  loginDetail: null | {
    token: string
    email: string
    profile_pic: string
    name: string
    role: string
    id?: number
  }
  setLoginDetail: React.Dispatch<
    SetStateAction<{
      token: string
      email: string
      profile_pic: string
      name: string
      role: string
      id?: number
    } | null>
  >
  logout: () => Promise<void>
  googleSignIn: () => Promise<User>
  emailSignIn: ({ email, password }: { email: string; password: string }) => Promise<User>
  emailSignUp: ({ email, password }: { email: string; password: string }) => Promise<User>
  loading: boolean
  setLoading: React.Dispatch<SetStateAction<boolean>>
  searchResults: unknown[] | null
  setSearchResults: React.Dispatch<SetStateAction<unknown[] | null>>
  searchQuery: string
  setSearchQuery: React.Dispatch<SetStateAction<string>>
  originalBlogData: unknown[] | null
  setOriginalBlogData: React.Dispatch<SetStateAction<unknown[] | null>>
  blogCategorySlugs: string[]
  setBlogCategorySlugs: React.Dispatch<SetStateAction<string[]>>
  blogAuthorEmails: string[]
  setBlogAuthorEmails: React.Dispatch<SetStateAction<string[]>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ token, children }: { token: string | null; children: ReactNode }) => {
  const [loginDetail, setLoginDetail] = useState<null | {
    token: string
    email: string
    profile_pic: string
    name: string
    role: string
    id?: number
  }>(null)
  const [loading, setLoading] = useState(!!token) // Initialize as true if token exists
  const [searchResults, setSearchResults] = useState<unknown[] | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [originalBlogData, setOriginalBlogData] = useState<unknown[] | null>(null)
  const [blogCategorySlugs, setBlogCategorySlugs] = useState<string[]>([])
  const [blogAuthorEmails, setBlogAuthorEmails] = useState<string[]>([])

  async function googleSignIn() {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    // signinWithEmailLink
    return result.user
  }

  async function emailSignUp({ email, password }: { email: string; password: string }) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  }

  async function emailSignIn({ email, password }: { email: string; password: string }) {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  async function logout() {
    getAuth().signOut()
    await signOut(auth)
      .then(async () => {
        const rawRes = await fetch('/api/user/auth/jwt/delete', {
          method: 'DELETE',
        })
        if (rawRes.ok) setLoginDetail(null)
      })
      .catch((error) => {
        console.error('Error signing out:', error)
      })
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const rawRes = await fetch(`/api/user/auth/jwt/verify`, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { Authorization: `bearer ${token}` } : undefined,
        })
        if (rawRes.ok) {
          const json = await rawRes.json()
          const docs = json.docs ?? (Array.isArray(json) ? json : [])
          const data = docs[0]
          const resolvedToken = json.token ?? token ?? null
          if (data && resolvedToken)
            setLoginDetail({
              token: resolvedToken,
              email: data.email,
              name: data.displayName,
              role: data.role,
              profile_pic: data.profileImage ? data.profileImage.url : null,
              id: data.id,
            })
        }
      } catch (error) {
        console.error('Error verifying token:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <AppContext.Provider
      value={{
        loginDetail,
        setLoginDetail,
        logout,
        googleSignIn,
        emailSignIn,
        emailSignUp,
        loading,
        setLoading,
        searchResults,
        setSearchResults,
        searchQuery,
        setSearchQuery,
        originalBlogData,
        setOriginalBlogData,
        blogCategorySlugs,
        setBlogCategorySlugs,
        blogAuthorEmails,
        setBlogAuthorEmails,
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
