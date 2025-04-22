import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/modules/auth/lib/jwtUtils'; 


const protectedPaths = [
  '/dashboard',
];


const publicPaths = [
  '/login',
  '/auth/telegram/callback',
  '/api/auth/telegram/verify',
  '/api/auth/me',
  '/api/auth/logout',
];


const protectedApiPaths = [
  '/api/dashboard',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  
  const token = request.cookies.get('auth_token')?.value;
  let isAuthenticated = false;
  let user = null;
  
  if (token) {
    const validationResult = await validateToken(token);
    isAuthenticated = validationResult.isValid;
    user = validationResult.user;
  }

  
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }

  
  if (protectedApiPaths.some(path => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    
    
    const requestHeaders = new Headers(request.headers);
    if (user) {
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-name', user.name);
      requestHeaders.set('x-user-telegram-id', user.telegram_id);
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Совпадение со всеми маршрутами, кроме:
     * - Файлов с расширением (например, .jpg)
     * - Статических файлов Next.js
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|.*\.\w+).*)',
  ],
}; 