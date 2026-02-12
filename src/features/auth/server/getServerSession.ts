import { cookies } from 'next/headers';

/**
 * Server-side session utility
 * Gets authenticated user from cookie session
 * Used in Server Components for fast, secure auth checks
 */
export async function getServerSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;
  
  if (!sessionToken) {
    return null;
  }
  
  try {
    // Use internal API endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/v2/auth/me`, {
      headers: {
        Cookie: `session-token=${sessionToken}`,
      },
      cache: 'no-store', // Always fresh for auth
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (error) {
    console.error('[getServerSession] Error:', error);
    return null;
  }
}
