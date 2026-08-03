import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const provider = searchParams.get('provider') || 'oauth'

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
      )
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing authorization code')
      return NextResponse.redirect(
        new URL('/login?error=Missing authorization code', request.url)
      )
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, provider)
    
    if (!tokenResponse.success) {
      console.error('Token exchange failed:', tokenResponse.error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(tokenResponse.error || 'Authentication failed')}`, request.url)
      )
    }

    // Get user profile from provider
    const userProfile = await getUserProfile(tokenResponse.access_token, provider)
    
    if (!userProfile) {
      console.error('Failed to get user profile')
      return NextResponse.redirect(
        new URL('/login?error=Failed to get user profile', request.url)
      )
    }

    // Create or update user in your database
    const user = await createOrUpdateUser(userProfile, provider)
    
    if (!user) {
      console.error('Failed to create/update user')
      return NextResponse.redirect(
        new URL('/login?error=Failed to create user account', request.url)
      )
    }

    // Create session/token
    const sessionToken = await createSession(user)
    
    // Set cookie or redirect with token
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    )
    
    // Set secure HTTP-only cookie
    response.cookies.set('authToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Also store user data in a non-http cookie for client access
    response.cookies.set('userData', JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }), {
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
      new URL(`/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
    )
  }
}

// Helper functions

async function exchangeCodeForToken(code, provider) {
  try {
    // Different providers have different token endpoints
    const tokenConfigs = {
      google: {
        url: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback?provider=google`
      },
      github: {
        url: 'https://github.com/login/oauth/access_token',
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback?provider=github`
      },
      // Add more providers as needed
    }

    const config = tokenConfigs[provider] || tokenConfigs.google
    
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    })

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
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in
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
    const profileUrls = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      github: 'https://api.github.com/user',
    }

    const url = profileUrls[provider] || profileUrls.google
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.status}`)
    }

    const data = await response.json()
    
    // Normalize user data based on provider
    let userProfile = {}
    
    switch(provider) {
      case 'google':
        userProfile = {
          provider: 'google',
          providerId: data.id,
          email: data.email,
          name: data.name,
          avatar: data.picture,
          verified: data.verified_email
        }
        break
      case 'github':
        userProfile = {
          provider: 'github',
          providerId: data.id.toString(),
          email: data.email || `${data.login}@github.com`,
          name: data.name || data.login,
          avatar: data.avatar_url,
          verified: true
        }
        break
      default:
        userProfile = {
          provider: provider,
          providerId: data.id || data.sub,
          email: data.email,
          name: data.name,
          avatar: data.avatar || data.picture,
          verified: true
        }
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

async function createSession(user) {
  try {
    // Create a JWT or session token
    // Example using JWT:
    /*
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    return token
    */

    // For now, return a mock token
    return `session_${Date.now()}_${user.id}`

  } catch (error) {
    console.error('Create session error:', error)
    throw error
  }
}
