import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/tech", "/manager"];

export async function updateSession(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  // Public routes (including /request, the kiosk page) never need a
  // Supabase session, so skip touching it entirely — a misconfigured or
  // unreachable Supabase project must never take down the public kiosk.
  if (!isProtected) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — redirecting to /login instead of crashing."
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (err) {
    console.error("Supabase middleware session check failed:", err);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
