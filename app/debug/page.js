'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function DebugPage() {
  const [envCheck, setEnvCheck] = useState(null)
  const [fetchResult, setFetchResult] = useState('Testing...')

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setEnvCheck({
      url: url || 'MISSING',
      keyPresent: key ? `present (${key.slice(0, 20)}...)` : 'MISSING',
    })
  }, [])

  const testBareSignup = async () => {
    setFetchResult('Testing BARE signUp (email+password only)...')
    const start = Date.now()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test${Date.now()}@gmail.com`,
        password: 'testpassword123',
      })
      const ms = Date.now() - start
      if (error) {
        setFetchResult(`BARE call ERROR after ${ms}ms: ${error.message}`)
      } else {
        setFetchResult(`BARE call SUCCESS after ${ms}ms: user id ${data?.user?.id || 'none'}`)
      }
    } catch (err) {
      const ms = Date.now() - start
      setFetchResult(`BARE call THREW after ${ms}ms: ${err.message}`)
    }
  }

  const testFullSignup = async () => {
    setFetchResult('Testing FULL signUp (with full_name, phone, role metadata — same as real form)...')
    const start = Date.now()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test${Date.now()}@gmail.com`,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Debug Test',
            phone: '+27821234567',
            role: 'landlord',
          },
        },
      })
      const ms = Date.now() - start
      if (error) {
        setFetchResult(`FULL call ERROR after ${ms}ms: ${error.message}`)
      } else {
        setFetchResult(`FULL call SUCCESS after ${ms}ms: user id ${data?.user?.id || 'none'}`)
      }
    } catch (err) {
      const ms = Date.now() - start
      setFetchResult(`FULL call THREW after ${ms}ms: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      <h2>Debug Info</h2>
      <p><strong>Env vars seen by browser:</strong></p>
      <pre>{JSON.stringify(envCheck, null, 2)}</pre>

      <p><strong>Result:</strong></p>
      <pre>{fetchResult}</pre>

      <button
        onClick={testBareSignup}
        style={{ padding: '10px 20px', marginTop: 10, background: '#333', color: 'white', border: 'none', borderRadius: 6, display: 'block', width: '100%' }}
      >
        1. Test BARE signUp (no metadata)
      </button>

      <button
        onClick={testFullSignup}
        style={{ padding: '10px 20px', marginTop: 10, background: '#900', color: 'white', border: 'none', borderRadius: 6, display: 'block', width: '100%' }}
      >
        2. Test FULL signUp (with metadata — matches real form)
      </button>
    </div>
  )
}
