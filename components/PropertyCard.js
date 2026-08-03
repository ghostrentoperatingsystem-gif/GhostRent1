'use client'

import Link from 'next/link'
import { Heart, Bed, Bath, MapPin, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/components/AuthProvider'

export default function PropertyCard({ property }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const { id, title, price, area, city, bedrooms, bathrooms, images, listing_type, status, published } = property

  useEffect(() => {
    async function checkSaved() {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const { data } = await supabase
          .from('saved_properties')
          .select('id')
          .eq('user_id', user.id)
          .eq('property_id', id)
          .single()
        setSaved(!!data)
      } catch (err) {
        setSaved(false)
      }
      setLoading(false)
    }
    checkSaved()
  }, [user, id])

  const toggleSave = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      alert('Please login to save properties')
      return
    }
    
    try {
      if (saved) {
        await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id)
        setSaved(false)
      } else {
        await supabase
          .from('saved_properties')
          .insert([{ user_id: user.id, property_id: id }])
        setSaved(true)
      }
    } catch (err) {
      console.error('Save error:', err)
    }
  }

  const isActive = status === 'approved' && published === true

  return (
    <Link href={`/property/${id}`}>
      <div className="bg-white rounded-card border border-line overflow-hidden hover:shadow-md transition">
        <div className="relative h-48 bg-paper">
          {images && images.length > 0 ? (
            <img 
              src={images[0]} 
              alt={title} 
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              No image
            </div>
          )}
          
          {/* Status badges */}
          {!isActive && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              {status === 'draft' ? 'Draft' : status === 'pending' ? 'Pending Review' : status}
            </div>
          )}
          
          <button
            onClick={toggleSave}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:scale-110 transition"
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-muted'}`} />
          </button>
          
          <span className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded-full ${
            listing_type === 'rent' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {listing_type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>

          {/* Lock icon for contact unlock */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" />
            R99
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{title || 'Untitled'}</h3>
          <p className="text-muted text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {area || ''}, {city || ''}
          </p>
          <p className="text-signal font-bold text-xl mt-1">R {parseFloat(price || 0).toLocaleString()}</p>
          <div className="flex gap-3 text-sm text-muted mt-2">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" /> {bedrooms || 0}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" /> {bathrooms || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
