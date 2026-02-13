'use server'

import { payload } from '@/payload-client'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function fetchComments(postId: number, limit: number = 10) {
  try {
    // Recursively fetch nested replies
    const fetchRepliesRecursively = async (parentId: number): Promise<any[]> => {
      const replies = await payload.find({
        collection: 'comments',
        where: {
          parent: {
            equals: parentId,
          },
          status: {
            equals: 'approved',
          },
        },
        depth: 2,
        sort: 'createdAt',
      })

      // Recursively fetch replies for each reply
      const repliesWithNested = await Promise.all(
        replies.docs.map(async (reply) => {
          const nestedReplies = await fetchRepliesRecursively(reply.id)
          return {
            ...reply,
            replies: nestedReplies,
          }
        }),
      )

      return repliesWithNested
    }

    // Fetch initial limited top-level comments
    const initialComments = await payload.find({
      collection: 'comments',
      where: {
        post: {
          equals: postId,
        },
        status: {
          equals: 'approved',
        },
        parent: {
          equals: null,
        },
      },
      depth: 2,
      sort: '-createdAt',
      limit: limit,
      pagination: true,
    })

    // Set to track all comment IDs we've fetched
    const fetchedCommentIds = new Set<number>()
    const commentsMap = new Map<number, any>()

    // Fetch replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      initialComments.docs.map(async (comment) => {
        fetchedCommentIds.add(comment.id)
        commentsMap.set(comment.id, comment)
        const replies = await fetchRepliesRecursively(comment.id)
        return {
          ...comment,
          replies: replies,
        }
      }),
    )

    // Find all parent IDs that are referenced but not fetched
    const findMissingParents = (comments: any[]): Set<number> => {
      const missingParents = new Set<number>()

      const traverse = (comment: any) => {
        if (comment.parent) {
          const parentId = typeof comment.parent === 'object' ? comment.parent.id : comment.parent
          if (parentId && !fetchedCommentIds.has(parentId)) {
            missingParents.add(parentId)
          }
        }

        if (comment.replies && Array.isArray(comment.replies)) {
          comment.replies.forEach(traverse)
        }
      }

      comments.forEach(traverse)
      return missingParents
    }

    // Fetch missing parents and their related comments
    let missingParents = findMissingParents(commentsWithReplies)
    let maxIterations = 10
    let iteration = 0

    while (missingParents.size > 0 && iteration < maxIterations) {
      iteration++

      const parentIdsArray = Array.from(missingParents)
      const parents = await payload.find({
        collection: 'comments',
        where: {
          id: {
            in: parentIdsArray,
          },
          status: {
            equals: 'approved',
          },
        },
        depth: 2,
      })

      const newComments: any[] = []
      for (const parent of parents.docs) {
        if (!fetchedCommentIds.has(parent.id)) {
          fetchedCommentIds.add(parent.id)
          commentsMap.set(parent.id, parent)

          const replies = await fetchRepliesRecursively(parent.id)
          newComments.push({
            ...parent,
            replies: replies,
          })
        }
      }

      commentsWithReplies.push(...newComments)
      missingParents = findMissingParents(commentsWithReplies)
    }

    // Filter to only include top-level comments
    const topLevelComments = commentsWithReplies.filter((comment) => {
      const parentId = typeof comment.parent === 'object' ? comment.parent?.id : comment.parent
      return !parentId || parentId === null
    })

    // Sort by creation date (newest first)
    topLevelComments.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    // Show "Anonymous User" publicly when the commenter has deleted their profile.
    // We don't delete comments; we only anonymize the user for the public blog.
    function anonymizeDeletedUser(comment: any): any {
      const c = { ...comment }
      const user = c.user
      if (user && (user.deleted_at != null || (typeof user === 'object' && user.deleted_at))) {
        c.user = { ...user, displayName: 'Anonymous User', profileImage: null }
      }
      if (c.replies && Array.isArray(c.replies)) {
        c.replies = c.replies.map(anonymizeDeletedUser)
      }
      return c
    }
    const commentsAnonymized = topLevelComments.map(anonymizeDeletedUser)

    return {
      comments: commentsAnonymized,
      total: initialComments.totalDocs,
      hasMore: initialComments.totalDocs > limit,
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return {
      comments: [],
      total: 0,
      hasMore: false,
    }
  }
}

export async function getCurrentUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) {
      return null
    }

    const accessSecret = process.env.ACCESS_SECRET
    if (!accessSecret) {
      return null
    }

    const jwtData: any = jwt.verify(token, accessSecret)
    const userData = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: jwtData.email,
        },
        uid: {
          equals: jwtData.uid,
        },
        deleted_at: {
          equals: null,
        },
      },
    })

    if (userData.docs.length > 0 && userData.docs[0].id) {
      return userData.docs[0].id
    }

    return null
  } catch (error) {
    return null
  }
}
