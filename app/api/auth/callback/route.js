import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken' // You'll need to install: npm install jsonwebtoken

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider') || 'oauth'

    // Validate CSRF state
    const cookieStore = await cookies()
    const storedState = cookieStore.get('oauth_state')?.value
    
    if (!state || !storedState || state !== storedState) {
      console.error('CSRF validation failed: state mismatch')
      return NextResponse.redirect(
        new URL('/login?error=invalid_request', request.url)
      )
    }

    // Clear the state cookie immediately after validation
    const clearStateResponse = NextResponse.redirect(
      new URL('/login?error=invalid_request', request.url)
    )
    clearStateResponse.cookies.delete('oauth_state')

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL('/login?error=authentication_failed', request.url)
      )
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing authorization code')
      return NextResponse.redirect(
        new URL('/login?error=missing_code', request.url)
      )
    }

    // Get redirect URI from request headers with fallback
    const origin = new URL(request.url).origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${origin}/api/auth/callback`

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, provider, redirectUri)
    
    if (!tokenResponse.success) {
      console.error('Token exchange failed:', tokenResponse.error)
      return NextResponse.redirect(
        new URL(`/login?error=token_exchange_failed`, request.url)
      )
    }

    // Get user profile from provider
    const userProfile = await getUserProfile(tokenResponse.access_token, provider)
    
    if (!userProfile) {
      console.error('Failed to get user profile')
      return NextResponse.redirect(
        new URL('/login?error=profile_fetch_failed', request.url)
      )
    }

    // Create or update user in your database
    const user = await createOrUpdateUser(userProfile, provider)
    
    if (!user) {
      console.error('Failed to create/update user')
      return NextResponse.redirect(
        new URL('/login?error=user_creation_failed', request.url)
      )
    }

    // Create JWT session token
    const sessionToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: provider
      },
      process.env.JWT_SECRET || 'fallback-secret-change-this',
      { expiresIn: '7d' }
    )

    // Create response with redirect
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
    
    // Set secure HTTP-only cookie with JWT
    response.cookies.set('authToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // REMOVE the non-httpOnly userData cookie - use /api/me instead
    // For client-side user data, you can set a minimal, non-sensitive cookie
    response.cookies.set('userId', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=authentication_failed', request.url)
    )
  }
}

async function exchangeCodeForToken(code, provider, redirectUri) {
  try {
    const tokenConfigs = {
      google: {
        url: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        url: 'https://github.com/login/oauth/access_token',
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
    }

    const config = tokenConfigs[provider]
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: redirectUri,
    })

    // Only add grant_type for non-GitHub providers
    if (provider !== 'github') {
      params.append('grant_type', 'authorization_code')
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Validate access token exists
    if (!data.access_token) {
      throw new Error('No access token in response')
    }

    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token || null,
      expires_in: data.expires_in || null,
    }
  } catch (error) {
    console.error('Token exchange error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function getUserProfile(accessToken, provider) {
  try {
    let userProfile = {}
    
    switch(provider) {
      case 'google': {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to get Google profile: ${response.status}`)
        }
        
        const data = await response.json()
        userProfile = {
          provider: 'google',
          providerId: data.id,
          email: data.email,
          name: data.name,
          avatar: data.picture,
          verified: data.verified_email || false
        }
        break
      }
      
      case 'github': {
        // Get primary user info
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          }
        })
        
        if (!userResponse.ok) {
          throw new Error(`Failed to get GitHub profile: ${userResponse.status}`)
        }
        
        const userData = await userResponse.json()
        
        // Get emails if primary email is null
        let email = userData.email
        let verified = true
        
        if (!email) {
          const emailsResponse = await fetch('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            }
          })
          
          if (emailsResponse.ok) {
            const emails = await emailsResponse.json()
            const primaryEmail = emails.find(e => e.primary && e.verified)
            if (primaryEmail) {
              email = primaryEmail.email
              verified = primaryEmail.verified
            } else {
              const firstVerified = emails.find(e => e.verified)
              if (firstVerified) {
                email = firstVerified.email
                verified = firstVerified.verified
              }
            }
          }
        }
        
        // If still no email, throw error instead of using fallback
        if (!email) {
          throw new Error('No valid email found for GitHub user')
        }
        
        userProfile = {
          provider: 'github',
          providerId: userData.id.toString(),
          email: email,
          name: userData.name || userData.login,
          avatar: userData.avatar_url,
          verified: verified
        }
        break
      }
      
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
    
    return userProfile
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

async function createOrUpdateUser(profile, provider) {
  try {
    // This is where you'd interact with your database
    // Example using Prisma:
    /*
    const user = await prisma.user.upsert({
      where: {
        email: profile.email,
      },
      update: {
        name: profile.name,
        avatar: profile.avatar,
        provider: provider,
        providerId: profile.providerId,
        verified: profile.verified,
        lastLogin: new Date(),
      },
      create: {
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        provider: provider,
        providerId: profile.providerId,
        verified: profile.verified,
        lastLogin: new Date(),
      },
    })
    return user
    */
    
    // For now, return a mock user
    return {
      id: profile.providerId || `user_${Date.now()}`,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      provider: provider,
      verified: profile.verified,
    }
  } catch (error) {
    console.error('Create/update user error:', error)
    return null
  }
      }
