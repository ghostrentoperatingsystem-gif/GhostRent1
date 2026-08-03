import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const TOKEN_CONFIGS = {
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
      return redirectToLogin('invalid_request')
    }

    // Handle OAuth error from provider
    if (error) {
      console.error('OAuth error:', error)
      return redirectToLogin('authentication_failed')
    }

    // Validate required parameters
    if (!code) {
      console.error('Missing authorization code')
      return redirectToLogin('missing_code')
    }

    // Get redirect URI from request
    const origin = new URL(request.url).origin || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUri = `${origin}/api/auth/callback`

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, provider, redirectUri)

    if (!tokenResponse.success) {
      console.error('Token exchange failed:', tokenResponse.error)
      return redirectToLogin('token_exchange_failed')
    }

    // Get user profile from provider
    const userProfile = await getUserProfile(tokenResponse.access_token, provider)

    if (!userProfile) {
      console.error('Failed to get user profile')
      return redirectToLogin('profile_fetch_failed')
    }

    // Create or update user in database
    const user = await createOrUpdateUser(userProfile, provider)

    if (!user) {
      console.error('Failed to create/update user')
      return redirectToLogin('user_creation_failed')
    }

    // Create JWT session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: provider,
      },
      process.env.JWT_SECRET || 'fallback-secret-change-this',
      { expiresIn: '7d' }
    )

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Set secure HTTP-only cookie with JWT
    response.cookies.set('authToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Set minimal non-httpOnly cookie for client access
    // For full user data, use /api/me endpoint
    response.cookies.set('userId', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    // Clear CSRF state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('Auth callback error:', error)
    return redirectToLogin('authentication_failed')
  }
}

function redirectToLogin(errorCode) {
  return NextResponse.redirect(new URL(`/login?error=${errorCode}`, 'http://localhost:3000'))
}

async function exchangeCodeForToken(code, provider, redirectUri) {
  try {
    const config = TOKEN_CONFIGS[provider]

    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
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
      error: error.message,
    }
  }
}

async function getUserProfile(accessToken, provider) {
  try {
    switch (provider) {
      case 'google':
        return await getGoogleProfile(accessToken)

      case 'github':
        return await getGitHubProfile(accessToken)

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

async function getGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get Google profile: ${response.status}`)
  }

  const data = await response.json()

  return {
    provider: 'google',
    providerId: data.id,
    email: data.email,
    name: data.name,
    avatar: data.picture,
    verified: data.verified_email || false,
  }
}

async function getGitHubProfile(accessToken) {
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  })

  if (!userResponse.ok) {
    throw new Error(`Failed to get GitHub profile: ${userResponse.status}`)
  }

  const userData = await userResponse.json()

  // Get email if not available from user endpoint
  let email = userData.email
  let verified = true

  if (!email) {
    const emailData = await getGitHubEmails(accessToken)
    if (emailData) {
      email = emailData.email
      verified = emailData.verified
    }
  }

  if (!email) {
    throw new Error('No valid email found for GitHub user')
  }

  return {
    provider: 'github',
    providerId: userData.id.toString(),
    email,
    name: userData.name || userData.login,
    avatar: userData.avatar_url,
    verified,
  }
}

async function getGitHubEmails(accessToken) {
  const response = await fetch('https://api.github.com/user/emails', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    return null
  }

  const emails = await response.json()

  // Find primary verified email
  const primaryEmail = emails.find((e) => e.primary && e.verified)
  if (primaryEmail) {
    return { email: primaryEmail.email, verified: primaryEmail.verified }
  }

  // Find any verified email
  const verifiedEmail = emails.find((e) => e.verified)
  if (verifiedEmail) {
    return { email: verifiedEmail.email, verified: verifiedEmail.verified }
  }

  return null
}

async function createOrUpdateUser(profile, provider) {
  try {
    // TODO: Implement with your database (Prisma, etc.)
    // Example:
    // const user = await prisma.user.upsert({
    //   where: { email: profile.email },
    //   update: {
    //     name: profile.name,
    //     avatar: profile.avatar,
    //     provider,
    //     providerId: profile.providerId,
    //     verified: profile.verified,
    //     lastLogin: new Date(),
    //   },
    //   create: {
    //     email: profile.email,
    //     name: profile.name,
    //     avatar: profile.avatar,
    //     provider,
    //     providerId: profile.providerId,
    //     verified: profile.verified,
    //     lastLogin: new Date(),
    //   },
    // })
    // return user

    // Mock user for now
    return {
      id: profile.providerId || `user_${Date.now()}`,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
      provider,
      verified: profile.verified,
    }
  } catch (error) {
    console.error('Create/update user error:', error)
    return null
  }
}
