'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackHeader({ title, onBack }) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-white border-b border-line px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
      <button onClick={handleBack} className="p-1 hover:bg-paper rounded-full transition">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="font-display text-lg font-bold">{title}</h1>
    </div>
  )
}