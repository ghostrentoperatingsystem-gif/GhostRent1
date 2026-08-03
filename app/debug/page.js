'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function DebugPage() {
  const [envCheck, setEnvCheck] = useState(null)
  const [fetchResult, setFetchResult] = useState('Testing...')

  useEffect(() => {
    // 1. Check if env vars actually made it into the browser bundle
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    setEnvCheck({
      url: url || 'MISSING',
      keyPresent: key ? `present (${key.slice(0, 20)}...)` : 'MISSING',
    })

    // 2. Try a raw, direct fetch to Supabase's auth health endpoint
    //    This bypasses the supabase-js client entirely, isolating
    //    whether the problem is the network path or the client code.
    if (url) {
      fetch(`${url}/auth/v1/health`)
        .then((res) => res.text())
        .then((text) => setFetchResult(`SUCCESS (status shown): ${text}`))
        .catch((err) => setFetchResult(`FAILED: ${err.message}`))
    } else {
      setFetchResult('Skipped — no URL to test')
    }
  }, [])

  const testSignupClient = async () => {
    setFetchResult('Testing supabase-js client call...')
    try {
      const { data, error } = await supabase.auth.signUp({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
      })
      if (error) {
        setFetchResult(`Client call ERROR: ${error.message}`)
      } else {
        setFetchResult(`Client call SUCCESS: ${JSON.stringify(data).slice(0, 200)}`)
      }
    } catch (err) {
      setFetchResult(`Client call THREW: ${err.message}`)
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      <h2>Debug Info</h2>
      <p><strong>Env vars seen by browser:</strong></p>
      <pre>{JSON.stringify(envCheck, null, 2)}</pre>

      <p><strong>Direct fetch to Supabase health endpoint:</strong></p>
      <pre>{fetchResult}</pre>

      <button
        onClick={testSignupClient}
        style={{ padding: '10px 20px', marginTop: 20, background: '#333', color: 'white', border: 'none', borderRadius: 6 }}
      >
        Test supabase-js signUp() directly
      </button>
    </div>
  )
}
