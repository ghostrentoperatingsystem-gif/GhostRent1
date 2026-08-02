'use client'

import { useAuth } from '@/components/AuthProvider'
import { setHub } from '@/services/profiles'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Home, Users, Briefcase } from 'lucide-react'

export default function ChooseHub() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (profile?.role) {
      router.push(`/${profile.role}`)
    }
  }, [profile, router])

  const selectRole = async (role) => {
    try {
      await setHub(user.id, role)
      await refreshProfile()
      router.push(`/${role}`)
    } catch (err) {
      console.error('Role selection error:', err)
    }
  }

  return (
    <ProtectedRoute requireRole={false}>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-paper">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-signal">GhostRent</h1>
          <p className="text-muted mt-2">Choose how you want to use GhostRent</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 w-full max-w-md">
          <button
            onClick={() => selectRole('tenant')}
            className="bg-white p-6 rounded-card border border-line hover:shadow-lg transition text-center"
          >
            <Users className="w-8 h-8 text-signal mx-auto mb-2" />
            <h2 className="font-semibold text-lg">Tenant</h2>
            <p className="text-sm text-muted">Find a place to rent</p>
          </button>
          
          <button
            onClick={() => selectRole('buyer')}
            className="bg-white p-6 rounded-card border border-line hover:shadow-lg transition text-center"
          >
            <Briefcase className="w-8 h-8 text-signal mx-auto mb-2" />
            <h2 className="font-semibold text-lg">Buyer</h2>
            <p className="text-sm text-muted">Buy a property</p>
          </button>
          
          <button
            onClick={() => selectRole('landlord')}
            className="bg-white p-6 rounded-card border border-line hover:shadow-lg transition text-center"
          >
            <Home className="w-8 h-8 text-signal mx-auto mb-2" />
            <h2 className="font-semibold text-lg">Landlord</h2>
            <p className="text-sm text-muted">Manage your properties</p>
          </button>
        </div>
      </div>
    </ProtectedRoute>
  )
}