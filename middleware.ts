import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = updateSession(request)
  const { data } = await supabase.auth.getUser()
  const user = data.user
  const { pathname, search } = request.nextUrl

  // Define completely public routes that require no auth check
  const publicRoutes = [
    '/terms',
    '/privacy',
    '/login',
    '/auth/callback',
    '/signup',
    '/about',
    '/contact',
    // Static assets and API routes are handled by Next.js automatically
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Server-side admin check - redirect non-admins immediately
  if (pathname.startsWith('/admin')) {
    const ADMIN_USER_ID = 'a4dc1d84-fc05-4018-b3ce-7c60f3a4244c'
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
    if (user.id !== ADMIN_USER_ID) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If user is logged in but hasn't completed onboarding, redirect to onboarding
  // Only check this for non-public routes and not already on onboarding
  if (user && !isPublicRoute && pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_complete) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/onboarding'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users from root to dashboard - AFTER onboarding check
  if (pathname === '/' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    // Only redirect to dashboard if onboarding is complete
    if (profile?.onboarding_complete) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check authentication for protected routes
  const protectedRoutes = [
    '/compete',
    '/connect',
    '/profile',
    '/settings',
    '/learn',
    '/schools',
    '/admin',
    '/dashboard',
  ]
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Allow access to specific public pages within protected routes
  const publicPages = [
    '/compete/leaderboard',
    '/compete/daily-battle',
    '/compete/weekly-duel',
    '/1v1',
    '/connect/ideas',
    '/connect/cofounder-match',
  ]
  
  const isPublicPage = publicPages.includes(pathname)
  
  // Allow access to /compete/leaderboard without authentication
  const isLeaderboardRoute = pathname === '/compete/leaderboard'
  
  // Allow access to user profile pages (/profile/[username]) without authentication
  const isUserProfileRoute = pathname.startsWith('/profile/') && 
    pathname.split('/').length === 3 && // Only /profile/username, not /profile/username/settings
    !pathname.includes('/settings') && !pathname.includes('/edit')
  
  if (isProtectedRoute && !user && !isLeaderboardRoute && !isUserProfileRoute && !isPublicPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect authenticated users away from /login
  if (pathname === '/login' && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect users who have completed onboarding away from /onboarding
  if (pathname === '/onboarding' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_complete) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/onboarding',
    '/compete/:path*',
    '/connect/:path*',
    '/profile/:path*',
    '/settings',
    '/learn',
    '/schools',
    '/admin/:path*',
    '/dashboard',
  ],
}
