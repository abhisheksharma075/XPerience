import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const urlError = searchParams.get('error_description') || searchParams.get('error');

  // If Supabase returned an error in the callback URL (e.g. otp_expired)
  if (urlError) {
    if (next === '/reset-password') {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(urlError)}`
      );
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(urlError)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const targetOrigin =
        !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;

      return NextResponse.redirect(`${targetOrigin}${next}`);
    }

    // Exchange failed (e.g. expired code or verifier mismatch)
    if (next === '/reset-password') {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(exchangeError.message)}`
      );
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Fallback if no code and no error
  if (next === '/reset-password') {
    return NextResponse.redirect(
      `${origin}/reset-password?error=${encodeURIComponent('No recovery code provided in URL')}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+user`);
}
