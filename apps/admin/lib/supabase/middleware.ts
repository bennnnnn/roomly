import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getPublicSupabaseEnv } from '../env';

import type { Database } from '@roomly/db-types';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getPublicSupabaseEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!user) {
    if (isPublic) return supabaseResponse;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('staff_role')
    .eq('id', user.id)
    .maybeSingle();

  const isStaff = profile?.staff_role === 'admin' || profile?.staff_role === 'moderator';

  if (!isStaff) {
    if (path === '/login') return supabaseResponse;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('error', 'staff_required');
    return NextResponse.redirect(loginUrl);
  }

  if (path === '/login') {
    const home = request.nextUrl.clone();
    home.pathname = '/';
    return NextResponse.redirect(home);
  }

  return supabaseResponse;
}
