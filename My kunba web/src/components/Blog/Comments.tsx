'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/context/store'
import Toast from '@/components/Toast'
import { MoreVertical, Trash2, Edit2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

type Comment = {
  id: number
  content: string
  createdAt: string
  user: {
    id: number
    displayName: string
    profileImage?: {
      url?: string
    } | null
    role: string
  }
  replies?: Comment[]
}

type CommentsProps = {
  postId: number
  postAuthorId: number
  initialComments?: Comment[]
  totalComments?: number
  hasMore?: boolean
  initialCurrentUserId?: number | null
}

// Recursive component to render nested comments/replies
type CommentItemProps = {
  comment: Comment
  depth: number
  postId: number
  postAuthorId: number
  loginDetail: any
  currentUserId: number | null
  submitting: boolean
  editingCommentId: number | null
  editContent: string
  replyingTo: number | null
  replyContents: Record<number, string>
  canSeeMenu: (comment: Comment) => boolean
  canEditComment: (comment: Comment) => boolean
  canDeleteComment: (comment: Comment) => boolean
  getInitials: (name: string) => string
  formatDate: (dateString: string) => string
  handleStartEdit: (comment: Comment) => void
  handleCancelEdit: () => void
  handleUpdateComment: (commentId: number) => void
  handleDeleteComment: (commentId: number) => void
  handleSubmitReply: (parentId: number, content?: string) => void
  setReplyingTo: (id: number | null) => void
  setReplyContents: React.Dispatch<React.SetStateAction<Record<number, string>>>
  setEditContent: (content: string) => void
  fetchComments: () => void
}

function CommentItem({
  comment,
  depth,
  postId,
  postAuthorId,
  loginDetail,
  currentUserId,
  submitting,
  editingCommentId,
  editContent,
  replyingTo,
  replyContents,
  canSeeMenu,
  canEditComment,
  canDeleteComment,
  getInitials,
  formatDate,
  handleStartEdit,
  handleCancelEdit,
  handleUpdateComment,
  handleDeleteComment,
  handleSubmitReply,
  setReplyingTo,
  setReplyContents,
  setEditContent,
  fetchComments,
}: CommentItemProps) {
  const maxDepth = 10 // Prevent infinite nesting
  // Calculate indentation - use fixed classes for Tailwind
  const getIndentClass = (d: number) => {
    if (d === 0) return 'ml-12'
    if (d === 1) return 'ml-12'
    if (d === 2) return 'ml-16'
    if (d === 3) return 'ml-20'
    return 'ml-24' // Max indentation
  }
  const indentClass = getIndentClass(depth)

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className={`${depth === 0 ? 'h-10 w-10' : 'h-8 w-8'} shrink-0`}>
          <AvatarImage
            src={
              typeof comment.user.profileImage === 'object' && comment.user.profileImage?.url
                ? comment.user.profileImage.url
                : ''
            }
            alt={comment.user.displayName}
          />
          <AvatarFallback>{getInitials(comment.user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.user.displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>
            {canSeeMenu(comment) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEditComment(comment) && (
                    <DropdownMenuItem onClick={() => handleStartEdit(comment)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDeleteComment(comment) && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {editingCommentId === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleUpdateComment(comment.id)}
                  disabled={submitting || !editContent.trim()}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}
          {loginDetail && editingCommentId !== comment.id && (
            <Button
              variant="ghost"
              className="h-8 text-xs border-none! hover:bg-transparent cursor-pointer hover:underline underline-offset-3 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            >
              {replyingTo === comment.id ? 'Cancel' : 'Reply'}
            </Button>
          )}
        </div>
      </div>

      {/* Reply Input */}
      {replyingTo === comment.id && (
        <div className={`flex gap-3 ${indentClass}`}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={loginDetail?.profile_pic || ''} alt={loginDetail?.name || ''} />
            <AvatarFallback>{loginDetail ? getInitials(loginDetail.name) : ''}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a reply..."
              value={replyContents[comment.id] || ''}
              onChange={(e) =>
                setReplyContents((prev) => ({ ...prev, [comment.id]: e.target.value }))
              }
              className="min-h-[60px] resize-none text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id, replyContents[comment.id])}
                disabled={submitting || !(replyContents[comment.id] || '').trim()}
              >
                {submitting ? 'Posting...' : 'Reply'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recursively render nested replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className={`${indentClass} space-y-4`}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              postId={postId}
              postAuthorId={postAuthorId}
              loginDetail={loginDetail}
              currentUserId={currentUserId}
              submitting={submitting}
              editingCommentId={editingCommentId}
              editContent={editContent}
              replyingTo={replyingTo}
              replyContents={replyContents}
              canSeeMenu={canSeeMenu}
              canEditComment={canEditComment}
              canDeleteComment={canDeleteComment}
              getInitials={getInitials}
              formatDate={formatDate}
              handleStartEdit={handleStartEdit}
              handleCancelEdit={handleCancelEdit}
              handleUpdateComment={handleUpdateComment}
              handleDeleteComment={handleDeleteComment}
              handleSubmitReply={handleSubmitReply}
              setReplyingTo={setReplyingTo}
              setReplyContents={setReplyContents}
              setEditContent={setEditContent}
              fetchComments={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Comments({
  postId,
  postAuthorId,
  initialComments = [],
  totalComments: initialTotalComments = 0,
  hasMore: initialHasMore = false,
  initialCurrentUserId = null,
}: CommentsProps) {
  const { loginDetail } = useAppStore()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [loading, setLoading] = useState(false) // Start with false since we have initial data
  const [submitting, setSubmitting] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  // Track reply content for each comment being replied to
  const [replyContents, setReplyContents] = useState<Record<number, string>>({})
  const [currentUserId, setCurrentUserId] = useState<number | null>(initialCurrentUserId)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalComments, setTotalComments] = useState(initialTotalComments)
  const [loadedCount, setLoadedCount] = useState(initialComments.length)

  // Fetch comments (only needed for refresh after mutations or load more)
  const fetchComments = async (append = false) => {
    try {
      if (!append) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const limit = 10
      const offset = append ? loadedCount : 0
      const res = await fetch(`/api/user/comments?postId=${postId}&limit=${limit}&offset=${offset}`)
      if (res.ok) {
        const data = await res.json()
        if (append) {
          // Append new comments to existing ones (avoid duplicates)
          const existingIds = new Set(comments.map((c) => c.id))
          const newComments = (data.comments || []).filter((c: Comment) => !existingIds.has(c.id))
          setComments((prev) => [...prev, ...newComments])
          setLoadedCount((prev) => prev + newComments.length)
        } else {
          setComments(data.comments || [])
          setLoadedCount(data.comments?.length || 0)
        }
        setHasMore(data.hasMore || false)
        setTotalComments(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Load more comments
  const handleLoadMore = async () => {
    await fetchComments(true)
  }

  // Fetch current user ID if not provided initially (for client-side updates)
  useEffect(() => {
    // Only fetch if we don't have initialCurrentUserId and loginDetail exists
    if (initialCurrentUserId === null && loginDetail) {
      const fetchCurrentUser = async () => {
        try {
          let token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('access_token='))
            ?.split('=')[1]

          if (!token && loginDetail?.token) {
            token = loginDetail.token
          }

          if (!token) {
            setCurrentUserId(null)
            return
          }

          const res = await fetch('/api/user/auth/jwt/verify', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0 && data[0]?.id) {
              setCurrentUserId(data[0].id)
            } else if (data?.id) {
              setCurrentUserId(data.id)
            }
          }
        } catch (error) {
          console.error('Error fetching current user:', error)
        }
      }

      fetchCurrentUser()
    }
  }, [loginDetail, initialCurrentUserId])

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Check if user can delete comment
  // Admin can delete any comment
  // Author can delete comments on their own posts
  // Users can delete their own comments
  const canDeleteComment = (comment: Comment) => {
    if (!loginDetail) return false

    // Admin can delete any comment (show immediately, don't wait for currentUserId)
    if (loginDetail.role === 'admin') return true

    // If currentUserId is not loaded yet, return false to avoid showing button prematurely
    if (!currentUserId) return false

    // Ensure we're comparing numbers
    const userId = Number(currentUserId)
    const commentUserId = Number(comment.user.id)

    // Author can delete comments on their own posts (if they own the post)
    if (loginDetail.role === 'author' && Number(postAuthorId) === userId) return true

    // Users can delete their own comments
    if (commentUserId === userId) return true

    return false
  }

  // Check if user can edit comment
  // Users can only edit their own comments
  const canEditComment = (comment: Comment) => {
    if (!loginDetail) return false

    // If currentUserId is not loaded yet, return false to avoid showing button prematurely
    if (!currentUserId) return false

    // Ensure we're comparing numbers
    const userId = Number(currentUserId)
    const commentUserId = Number(comment.user.id)

    // Users can only edit their own comments
    return commentUserId === userId
  }

  // Check if user can see the menu (either edit or delete)
  const canSeeMenu = (comment: Comment) => {
    return canEditComment(comment) || canDeleteComment(comment)
  }

  // Submit comment
  const handleSubmitComment = async () => {
    if (!loginDetail) {
      Toast({
        message: 'Please login',
        description: 'You need to be logged in to comment',
        isSuccess: false,
      })
      return
    }

    if (!commentContent.trim()) {
      Toast({
        message: 'Comment required',
        description: 'Please enter a comment',
        isSuccess: false,
      })
      return
    }

    setSubmitting(true)
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch('/api/user/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          postId,
          content: commentContent,
        }),
      })

      const data = await res.json()

      if (res.status === 403 && data.message?.includes('verify')) {
        Toast({
          message: 'Verification Required',
          description: 'Please verify your account before posting comments',
          isSuccess: false,
        })
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to post comment')
      }

      setCommentContent('')
      Toast({
        message: 'Success',
        description: 'Comment posted successfully',
        isSuccess: true,
      })
      fetchComments()
    } catch (error: any) {
      Toast({
        message: 'Error',
        description: error.message || 'Failed to post comment',
        isSuccess: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Submit reply (works for any comment/reply)
  const handleSubmitReply = async (parentId: number, content?: string) => {
    if (!loginDetail) {
      Toast({
        message: 'Please login',
        description: 'You need to be logged in to reply',
        isSuccess: false,
      })
      return
    }

    const replyText = content || replyContents[parentId] || replyContent
    if (!replyText.trim()) {
      Toast({
        message: 'Reply required',
        description: 'Please enter a reply',
        isSuccess: false,
      })
      return
    }

    setSubmitting(true)
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch('/api/user/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          postId,
          content: replyText.trim(),
          parentId,
        }),
      })

      const data = await res.json()

      if (res.status === 403 && data.message?.includes('verify')) {
        Toast({
          message: 'Verification Required',
          description: 'Please verify your account before posting comments',
          isSuccess: false,
        })
        setSubmitting(false)
        return
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to post reply')
      }

      // Clear the reply content for this specific parent
      if (replyContents[parentId]) {
        setReplyContents((prev) => {
          const newContents = { ...prev }
          delete newContents[parentId]
          return newContents
        })
      } else {
        setReplyContent('')
      }
      setReplyingTo(null)
      Toast({
        message: 'Success',
        description: 'Reply posted successfully',
        isSuccess: true,
      })
      fetchComments()
    } catch (error: any) {
      Toast({
        message: 'Error',
        description: error.message || 'Failed to post reply',
        isSuccess: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Start editing comment
  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  // Update comment
  const handleUpdateComment = async (commentId: number) => {
    if (!loginDetail) return

    if (!editContent.trim()) {
      Toast({
        message: 'Comment required',
        description: 'Please enter a comment',
        isSuccess: false,
      })
      return
    }

    setSubmitting(true)
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch(`/api/user/comments?id=${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update comment')
      }

      setEditingCommentId(null)
      setEditContent('')
      Toast({
        message: 'Success',
        description: 'Comment updated successfully',
        isSuccess: true,
      })
      fetchComments()
    } catch (error: any) {
      Toast({
        message: 'Error',
        description: error.message || 'Failed to update comment',
        isSuccess: false,
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!loginDetail) return

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('access_token='))
        ?.split('=')[1]

      const res = await fetch(`/api/user/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete comment')
      }

      Toast({
        message: 'Success',
        description: 'Comment deleted successfully',
        isSuccess: true,
      })
      fetchComments()
    } catch (error: any) {
      Toast({
        message: 'Error',
        description: error.message || 'Failed to delete comment',
        isSuccess: false,
      })
    }
  }

  // Only show loading if we don't have initial data
  if (loading && comments.length === 0) {
    return (
      <div className="mt-8 space-y-4">
        <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">
          {totalComments > 0 ? totalComments : comments.length}{' '}
          {(totalComments > 0 ? totalComments : comments.length) === 1 ? 'Comment' : 'Comments'}
        </h2>
        <Separator />
      </div>

      {/* Comment Input */}
      {loginDetail ? (
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={loginDetail.profile_pic || ''} alt={loginDetail.name} />
            <AvatarFallback>{getInitials(loginDetail.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentContent('')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={submitting || !commentContent.trim()}
              >
                {submitting ? 'Posting...' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Please login to comment</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              postId={postId}
              postAuthorId={postAuthorId}
              loginDetail={loginDetail}
              currentUserId={currentUserId}
              submitting={submitting}
              editingCommentId={editingCommentId}
              editContent={editContent}
              replyingTo={replyingTo}
              replyContents={replyContents}
              canSeeMenu={canSeeMenu}
              canEditComment={canEditComment}
              canDeleteComment={canDeleteComment}
              getInitials={getInitials}
              formatDate={formatDate}
              handleStartEdit={handleStartEdit}
              handleCancelEdit={handleCancelEdit}
              handleUpdateComment={handleUpdateComment}
              handleDeleteComment={handleDeleteComment}
              handleSubmitReply={handleSubmitReply}
              setReplyingTo={setReplyingTo}
              setReplyContents={setReplyContents}
              setEditContent={setEditContent}
              fetchComments={fetchComments}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="min-w-[120px]"
          >
            {loadingMore ? 'Loading...' : 'Load More Comments'}
          </Button>
        </div>
      )}
    </div>
  )
}
