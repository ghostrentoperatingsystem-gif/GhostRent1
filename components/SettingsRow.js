'use client'

import { ChevronRight } from 'lucide-react'

export default function SettingsRow({ 
  label, 
  description, 
  type = 'link', 
  value, 
  onChange, 
  onClick,
  icon: Icon
}) {
  if (type === 'toggle') {
    return (
      <div className="flex items-start justify-between py-3 px-4 hover:bg-paper/50 transition">
        <div className="flex-1">
          <p className="font-medium text-sm">{label}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`w-10 h-6 rounded-full transition relative flex-shrink-0 ${
            value ? 'bg-signal' : 'bg-line'
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition ${
            value ? 'right-0.5' : 'left-0.5'
          }`} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between py-3 px-4 hover:bg-paper/50 transition w-full text-left"
    >
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon className="w-5 h-5 text-muted" />}
        <div>
          <p className="font-medium text-sm">{label}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
          {value && <p className="text-xs text-signal">{value}</p>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted flex-shrink-0" />
    </button>
  )
}