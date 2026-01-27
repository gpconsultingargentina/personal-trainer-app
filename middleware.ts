import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'trainer' | 'student' | null

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session automáticamente
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const role = user?.user_metadata?.role as UserRole

  // Proteger rutas del dashboard - solo trainer
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (role !== 'trainer') {
      // Si es student, redirigir a portal
      if (role === 'student') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      // Si no tiene rol, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Proteger rutas del portal - solo student
  if (pathname.startsWith('/portal')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (role !== 'student') {
      // Si es trainer, redirigir a dashboard
      if (role === 'trainer') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Si no tiene rol, redirigir a login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Página de login - redirigir según rol si ya autenticado
  if (pathname === '/login') {
    if (user) {
      if (role === 'trainer') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (role === 'student') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      // Usuario sin rol válido, mantener en login
    }
  }

  // Página de registro - solo sin autenticar
  if (pathname === '/registro') {
    if (user) {
      if (role === 'trainer') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (role === 'student') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

