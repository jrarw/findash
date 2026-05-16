import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { CookieOptions } from '@supabase/ssr'

type CookieToSet = { name: string; value: string; options: CookieOptions }
type TypedSupabaseClient = SupabaseClient<Database, 'public', 'public', Database['public']>

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  ) as unknown as TypedSupabaseClient

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/onboarding')

  // Protege áreas autenticadas.
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('role, onboarding_concluido')
      .eq('id', user.id)
      .maybeSingle()

    const onboardingConcluido = usuario?.onboarding_concluido === true

    // Usuários logados incompletos sempre finalizam o onboarding antes do dashboard.
    if (!onboardingConcluido && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (onboardingConcluido && pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname === '/login' || pathname === '/cadastro' || pathname === '/') {
      return NextResponse.redirect(new URL(onboardingConcluido ? '/dashboard' : '/onboarding', request.url))
    }

    // Protege /admin (só admins)
    if (pathname.startsWith('/admin') && usuario?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}
