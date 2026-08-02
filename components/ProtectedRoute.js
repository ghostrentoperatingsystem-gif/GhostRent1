'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children, requireRole = false }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (requireRole && !profile?.role) {
        router.push('/choose-hub')
      }
    }
  }, [user, profile, loading, router, requireRole])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    )
  }

  if (requireRole && !profile?.role) {
    return null
  }

  return children
}