/**
 * Client-side storage utility functions for draft data
 *
 * STORAGE STRATEGY:
 * ================
 * This module uses a hybrid approach to ensure draft data persists across browser restarts:
 *
 * 1. INDEXEDDB (Primary for large data):
 *    - Capacity: ~500MB+ per origin
 *    - Persistence: ✅ Survives browser restarts, clears, and updates
 *    - Used for: Images (data URLs), large content (>1KB), any data >2KB
 *    - Reliability: High - transactions ensure data integrity
 *
 * 2. COOKIES (Fallback for small data):
 *    - Capacity: ~4KB per cookie
 *    - Persistence: ✅ Survives browser restarts
 *    - Used for: Small drafts (<2KB), metadata
 *    - Reliability: Medium - size limitations
 *
 * WHY INDEXEDDB?
 * ==============
 * - Data URLs from images can be 100KB-5MB+ in size
 * - Rich text content can easily exceed cookie limits
 * - IndexedDB is designed for large, structured data
 * - Persists across browser sessions (unlike sessionStorage)
 * - More reliable than localStorage for large data
 *
 * PERSISTENCE GUARANTEE:
 * ======================
 * - IndexedDB data persists until explicitly cleared or browser data is cleared
 * - Works across browser restarts, computer restarts, and updates
 * - Only cleared when user clears browser data or we call clearDraftCookie()
 */

const DRAFT_COOKIE_NAME = 'blog_draft_data'
const DRAFT_DB_NAME = 'BlogDrafts'
const DRAFT_STORE_NAME = 'drafts'
const DRAFT_DB_VERSION = 1
const DRAFT_COOKIE_EXPIRY_DAYS = 30

export interface BlogDraftData {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  status?: 'draft' | 'published'
  publishDate?: string
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  imageAltText?: string
  externalLinks?: Array<{ url: string; anchorText: string }>
  internalLinks?: Array<{ url: string; anchorText: string }>
  faq?: Array<{ question: string; answer: string }>
  categories?: number[]
  tags?: number[]
  coverImage?: string
  // Metadata properties (not part of actual draft data)
  hasIndexedDBData?: boolean
  timestamp?: number
}

/**
 * Set a cookie with the given name, value, and expiration days
 */
function setCookie(name: string, value: string, days: number = DRAFT_COOKIE_EXPIRY_DAYS) {
  if (typeof window === 'undefined') return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null

  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
  }
  return null
}

/**
 * Delete a cookie by name
 */
function deleteCookie(name: string) {
  if (typeof window === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

/** Cookie names for blog listing filters (category/author on "/") */
const BLOG_FILTER_CATEGORY = 'blog_filter_category'
const BLOG_FILTER_AUTHOR = 'blog_filter_author'
const BLOG_FILTER_COOKIE_DAYS = 365

/**
 * Read saved category slug and author email from cookies (for blog dropdowns on "/").
 */
export function getBlogFilterFromCookies(): { categorySlug: string; authorEmail: string } {
  const categorySlug = getCookie(BLOG_FILTER_CATEGORY)
  const authorEmail = getCookie(BLOG_FILTER_AUTHOR)
  return {
    categorySlug: categorySlug && categorySlug.trim() !== '' ? categorySlug : 'all',
    authorEmail: authorEmail && authorEmail.trim() !== '' ? authorEmail : 'all',
  }
}

/**
 * Save category slug and author email to cookies (for blog dropdowns on "/").
 */
export function setBlogFilterCookies(categorySlug: string, authorEmail: string) {
  setCookie(
    BLOG_FILTER_CATEGORY,
    categorySlug === 'all' ? '' : categorySlug,
    BLOG_FILTER_COOKIE_DAYS,
  )
  setCookie(
    BLOG_FILTER_AUTHOR,
    authorEmail === 'all' ? '' : authorEmail,
    BLOG_FILTER_COOKIE_DAYS,
  )
}

/**
 * Save blog draft data using IndexedDB for large data and cookies for metadata
 * IndexedDB is ALWAYS used for any data with images or content > 1KB to ensure persistence
 */
export async function saveDraftToCookie(data: BlogDraftData) {
  try {
    const processedData = { ...data }
    let useIndexedDB = false

    // ALWAYS use IndexedDB for data URLs (images) - they can be very large
    const hasImage = processedData.coverImage && processedData.coverImage.startsWith('data:')

    // Use IndexedDB for content larger than 1KB or if total data would exceed cookie limit
    const contentSize = processedData.content?.length || 0
    const imageSize = processedData.coverImage?.length || 0
    const testJsonSize = JSON.stringify(processedData).length

    // When SEO/links/FAQ have data, always use IndexedDB so they are never truncated by cookie size
    const hasSeoOrLinksOrFaq =
      (processedData.focusKeyword && processedData.focusKeyword.trim().length > 0) ||
      (processedData.externalLinks && processedData.externalLinks.length > 0) ||
      (processedData.internalLinks && processedData.internalLinks.length > 0) ||
      (processedData.faq && processedData.faq.length > 0)

    // Decision: Use IndexedDB if:
    // 1. Has image (data URL) - ALWAYS use IndexedDB for images
    // 2. Content is larger than 1KB
    // 3. Total JSON would be larger than 2KB (cookie safety margin)
    // 4. Image size is larger than 1KB (even if not data URL, might be large)
    // 5. Has focusKeyword / externalLinks / internalLinks / faq (avoid cookie truncation)
    useIndexedDB = Boolean(
      hasImage ||
        contentSize > 1000 ||
        testJsonSize > 2000 ||
        imageSize > 1000 ||
        hasSeoOrLinksOrFaq,
    )

    if (useIndexedDB) {
      console.log('Using IndexedDB for draft storage:', {
        hasImage,
        contentSize,
        imageSize,
        totalSize: testJsonSize,
      })
    }

    if (useIndexedDB) {
      // Verify IndexedDB is available before attempting save
      const isIndexedDBAvailable = await verifyIndexedDBAvailable()

      if (isIndexedDBAvailable) {
        // Save to IndexedDB (persistent, large capacity)
        try {
          await saveToIndexedDB(processedData)
          const dataSize = JSON.stringify(processedData).length
          console.log('✅ Draft saved to IndexedDB successfully, size:', dataSize, 'chars')

          // Save a small metadata cookie indicating IndexedDB is being used
          // This helps with quick checks and ensures we know where to look
          const metadata = {
            hasIndexedDBData: true,
            timestamp: Date.now(),
            title: processedData.title?.substring(0, 50), // Preview of title
          }
          setCookie(DRAFT_COOKIE_NAME, JSON.stringify(metadata), DRAFT_COOKIE_EXPIRY_DAYS)
          return
        } catch (storageError) {
          console.error('❌ IndexedDB save failed, trying fallback:', storageError)
          // If IndexedDB fails and data is too large for cookies, we have a problem
          if (testJsonSize > 3000) {
            console.error('⚠️ Data too large for cookies and IndexedDB failed - data may be lost!')
            throw new Error('Unable to save large draft data - IndexedDB unavailable')
          }
          // Fallback to cookie-only approach for small data
          return saveDraftFallback(data)
        }
      } else {
        console.warn('⚠️ IndexedDB not available, using cookie fallback')
        // If data is too large, warn user
        if (testJsonSize > 3000) {
          console.error(
            '⚠️ Large data cannot be saved - IndexedDB unavailable and data exceeds cookie limit',
          )
        }
        return saveDraftFallback(data)
      }
    } else {
      // Small data, save to cookies
      return saveDraftFallback(data)
    }
  } catch (error) {
    console.error('Error saving draft:', error)
    // Try fallback
    return saveDraftFallback(data)
  }
}

/**
 * Fallback save function for cookies (original logic)
 */
function saveDraftFallback(data: BlogDraftData) {
  try {
    const processedData = { ...data }

    // Log data URL size for debugging
    if (processedData.coverImage && processedData.coverImage.startsWith('data:')) {
      const dataUrlSize = processedData.coverImage.length
      console.log('Data URL size:', dataUrlSize, 'characters')
    }

    const jsonData = JSON.stringify(processedData)

    // localStorage should be preferred, but if we're here, warn about size
    if (jsonData.length > 3000) {
      console.warn('Draft data is large for cookie storage:', jsonData.length, 'chars')
    }

    setCookie(DRAFT_COOKIE_NAME, jsonData, DRAFT_COOKIE_EXPIRY_DAYS)
    console.log('✅ Draft saved to cookie fallback, size:', jsonData.length, 'chars')
  } catch (error) {
    console.error('Error saving draft to cookie fallback:', error)
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('Cookie quota exceeded - draft data is too large to save')
    }
  }
}

/**
 * Load blog draft data from IndexedDB (preferred) or cookies (fallback)
 * This function ensures data persists across browser restarts
 */
export async function loadDraftFromCookie(): Promise<BlogDraftData | null> {
  try {
    // First, check cookie for metadata to know where to look
    const cookieData = getCookie(DRAFT_COOKIE_NAME)
    let shouldCheckIndexedDB = true

    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData) as BlogDraftData
        if (parsed.hasIndexedDBData) {
          // Metadata indicates IndexedDB should have the data
          shouldCheckIndexedDB = true
        } else {
          // No metadata flag, might be old cookie data - check both
          shouldCheckIndexedDB = true
        }
      } catch (e) {
        // Cookie might be corrupted, check IndexedDB anyway
        shouldCheckIndexedDB = true
      }
    }

    // Always check IndexedDB first if available (it has the full data)
    if (shouldCheckIndexedDB) {
      try {
        const indexedDBData = await loadFromIndexedDB()
        if (indexedDBData) {
          console.log('✅ Draft loaded from IndexedDB (persistent storage)')
          return indexedDBData
        }
      } catch (indexedDBError) {
        console.warn('IndexedDB load failed, trying cookies:', indexedDBError)
      }
    }

    // Fallback to cookies if IndexedDB doesn't have data
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData) as BlogDraftData

        // If this is just metadata, don't return it
        if (parsed.hasIndexedDBData && !parsed.title && !parsed.content) {
          console.warn('Only metadata found in cookie, IndexedDB data missing')
          // Try to clean up stale metadata
          await clearDraftCookie()
          return null
        }

        // Return actual draft data from cookie (any meaningful field)
        const hasDraftContent =
          parsed.title ||
          parsed.content ||
          parsed.coverImage ||
          parsed.excerpt ||
          parsed.metaTitle ||
          parsed.metaDescription ||
          parsed.focusKeyword ||
          parsed.imageAltText ||
          (parsed.externalLinks && parsed.externalLinks.length > 0) ||
          (parsed.internalLinks && parsed.internalLinks.length > 0) ||
          (parsed.faq && parsed.faq.length > 0) ||
          (parsed.categories && parsed.categories.length > 0)
        if (hasDraftContent) {
          console.log('✅ Draft loaded from cookie, size:', cookieData.length, 'chars')
          return parsed
        }
      } catch (parseError) {
        console.error('Error parsing cookie data:', parseError)
      }
    }

    return null
  } catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
}

/**
 * Clear blog draft data from both IndexedDB and cookies
 * Attempts to clear both, even if one fails
 */
export async function clearDraftCookie() {
  let clearedIndexedDB = false
  let clearedCookie = false

  // Clear IndexedDB (don't throw if it fails)
  try {
    await clearIndexedDB()
    clearedIndexedDB = true
    console.log('✅ IndexedDB draft cleared')
  } catch (error) {
    console.warn('⚠️ Failed to clear IndexedDB draft (non-critical):', error)
  }

  // Clear cookies (always attempt, even if IndexedDB failed)
  try {
    deleteCookie(DRAFT_COOKIE_NAME)
    clearedCookie = true
    console.log('✅ Cookie draft cleared')
  } catch (error) {
    console.warn('⚠️ Failed to clear cookie draft (non-critical):', error)
  }

  if (clearedIndexedDB && clearedCookie) {
    console.log('✅ Draft cleared from both IndexedDB and cookies')
  } else if (clearedIndexedDB || clearedCookie) {
    console.log('⚠️ Draft partially cleared (some operations failed)')
  } else {
    console.error('❌ Failed to clear draft from both storage locations')
  }
}

// IndexedDB helper functions with retry logic
function openIndexedDB(retries = 3): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'))
      return
    }

    const request = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION)

    request.onerror = () => {
      if (retries > 0) {
        console.warn(`IndexedDB open failed, retrying... (${retries} attempts left)`)
        setTimeout(() => {
          openIndexedDB(retries - 1)
            .then(resolve)
            .catch(reject)
        }, 100)
      } else {
        reject(request.error || new Error('Failed to open IndexedDB after retries'))
      }
    }

    request.onsuccess = () => {
      const db = request.result
      // Handle database close events
      db.onerror = (event) => {
        console.error('IndexedDB error:', event)
      }
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        const objectStore = db.createObjectStore(DRAFT_STORE_NAME)
        console.log('IndexedDB object store created:', DRAFT_STORE_NAME)
      }
    }

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked - another tab may be open')
    }
  })
}

async function saveToIndexedDB(data: BlogDraftData): Promise<void> {
  let db: IDBDatabase | null = null
  try {
    db = await openIndexedDB()
    const transaction = db.transaction([DRAFT_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(DRAFT_STORE_NAME)

    // Wait for both the put operation and transaction to complete
    await new Promise<void>((resolve, reject) => {
      // Set up transaction handlers first
      transaction.oncomplete = () => {
        console.log('IndexedDB transaction completed successfully')
        resolve()
      }

      transaction.onerror = () => {
        reject(transaction.error || new Error('Transaction failed'))
      }

      transaction.onabort = () => {
        reject(new Error('Transaction aborted'))
      }

      // Perform the put operation
      const request = store.put(data, 'blog_draft')

      request.onsuccess = () => {
        // Put succeeded, but wait for transaction.oncomplete
        console.log('IndexedDB put operation succeeded, waiting for transaction...')
      }

      request.onerror = () => {
        reject(request.error || new Error('Put operation failed'))
      }
    })
  } catch (error) {
    console.error('Error saving to IndexedDB:', error)
    throw error
  } finally {
    if (db) {
      db.close()
    }
  }
}

async function loadFromIndexedDB(): Promise<BlogDraftData | null> {
  let db: IDBDatabase | null = null
  try {
    db = await openIndexedDB()
    const transaction = db.transaction([DRAFT_STORE_NAME], 'readonly')
    const store = transaction.objectStore(DRAFT_STORE_NAME)

    const data = await new Promise<BlogDraftData | null>((resolve, reject) => {
      // Set up transaction error handler
      transaction.onerror = () => {
        reject(transaction.error || new Error('Transaction failed'))
      }

      transaction.onabort = () => {
        reject(new Error('Transaction aborted'))
      }

      // Perform the get operation
      const request = store.get('blog_draft')

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          console.log('✅ Data found in IndexedDB')
          resolve(result)
        } else {
          console.log('No data found in IndexedDB')
          resolve(null)
        }
      }

      request.onerror = () => {
        reject(request.error || new Error('Get operation failed'))
      }
    })

    return data
  } catch (error) {
    console.error('Error loading from IndexedDB:', error)
    return null
  } finally {
    if (db) {
      db.close()
    }
  }
}

async function clearIndexedDB(): Promise<void> {
  let db: IDBDatabase | null = null
  try {
    db = await openIndexedDB()
    const transaction = db.transaction([DRAFT_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(DRAFT_STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const request = store.clear()

      request.onsuccess = () => {
        transaction.oncomplete = () => {
          console.log('IndexedDB cleared successfully')
          resolve()
        }
        transaction.onerror = () => {
          reject(transaction.error || new Error('Clear transaction failed'))
        }
      }

      request.onerror = () => {
        reject(request.error || new Error('Clear operation failed'))
      }
    })
  } catch (error) {
    console.error('Error clearing IndexedDB:', error)
  } finally {
    if (db) {
      db.close()
    }
  }
}

async function hasIndexedDBData(): Promise<boolean> {
  try {
    const data = await loadFromIndexedDB()
    return data !== null
  } catch (error) {
    return false
  }
}

/**
 * Verify IndexedDB is available and working
 */
export async function verifyIndexedDBAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available in this environment')
      return false
    }

    // Try to open the database
    const db = await openIndexedDB()
    if (db) {
      db.close()
      console.log('✅ IndexedDB is available and working')
      return true
    }
    return false
  } catch (error) {
    console.error('IndexedDB verification failed:', error)
    return false
  }
}

/**
 * Test the storage system by saving and loading a test draft
 * Useful for debugging storage issues
 */
export async function testDraftStorage(): Promise<boolean> {
  try {
    const testData: BlogDraftData = {
      title: 'Test Draft',
      content: 'This is a test draft to verify storage is working',
      timestamp: Date.now(),
    }

    // Test save
    await saveDraftToCookie(testData)
    console.log('✅ Test draft saved')

    // Test load
    const loaded = await loadDraftFromCookie()
    if (loaded && loaded.title === 'Test Draft') {
      console.log('✅ Test draft loaded successfully - storage is working!')

      // Clean up test data
      await clearDraftCookie()
      return true
    } else {
      console.error('❌ Test draft load failed - data mismatch')
      return false
    }
  } catch (error) {
    console.error('❌ Storage test failed:', error)
    return false
  }
}

/**
 * Check if draft data exists in IndexedDB or cookies (async version)
 */
export async function hasDraftDataAsync(): Promise<boolean> {
  try {
    // Check IndexedDB first
    const indexedDBData = await loadFromIndexedDB()
    if (indexedDBData) {
      return true
    }

    // Check cookies
    const cookieData = getCookie(DRAFT_COOKIE_NAME)
    if (cookieData) {
      try {
        const parsed = JSON.parse(cookieData) as BlogDraftData
        // Only return true if it's actual data, not just metadata
        return !!(
          parsed.title ||
          parsed.content ||
          parsed.coverImage ||
          parsed.excerpt ||
          parsed.metaTitle ||
          parsed.metaDescription ||
          parsed.focusKeyword ||
          parsed.imageAltText ||
          (parsed.externalLinks && parsed.externalLinks.length > 0) ||
          (parsed.internalLinks && parsed.internalLinks.length > 0) ||
          (parsed.faq && parsed.faq.length > 0) ||
          (parsed.categories && parsed.categories.length > 0)
        )
      } catch (error) {
        return false
      }
    }
    return false
  } catch (error) {
    return false
  }
}

/**
 * Check if draft data exists (synchronous - checks cookies only for quick check)
 */
export function hasDraftData(): boolean {
  const cookieData = getCookie(DRAFT_COOKIE_NAME)
  return cookieData !== null
}
