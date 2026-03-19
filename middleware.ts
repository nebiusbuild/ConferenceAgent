import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow public routes without auth
  const publicPaths = ['/display', '/api/webhooks', '/sign-in', '/_next', '/favicon.ico']
  const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // When Clerk is configured, uncomment the following:
  // import { authMiddleware } from '@clerk/nextjs'
  // return authMiddleware({ publicRoutes: publicPaths })(request, {} as any)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
