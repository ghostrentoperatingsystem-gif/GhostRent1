'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Home, Search, Heart, User, Plus, MessageSquare, Bell, Compass } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const role = profile?.role || 'tenant'

  const navItems = {
    tenant: [
      { label: 'Explore', href: '/tenant', icon: Compass },
      { label: 'Favourites', href: '/favorites', icon: Heart },
      { label: 'Alerts', href: '/alerts', icon: Bell },
      { label: 'Profile', href: '/profile', icon: User },
    ],
    buyer: [
      { label: 'Explore', href: '/buyer', icon: Compass },
      { label: 'Favourites', href: '/favorites', icon: Heart },
      { label: 'Alerts', href: '/alerts', icon: Bell },
      { label: 'Profile', href: '/profile', icon: User },
    ],
    landlord: [
      { label: 'Home', href: '/landlord', icon: Home },
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      { label: 'Alerts', href: '/alerts', icon: Bell },
      { label: 'Profile', href: '/profile', icon: User },
    ],
  }

  const items = navItems[role] || navItems.tenant

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-line flex justify-around py-2 z-50">
      {items.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center text-xs ${
              isActive ? 'text-signal' : 'text-muted'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-signal' : ''}`} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}