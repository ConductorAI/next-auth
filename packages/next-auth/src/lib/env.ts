// @ts-expect-error Next.js does not yet correctly use the `package.json#exports` field
import { NextRequest } from "next/server"
import type { NextAuthConfig } from "./index.js"
import { setEnvDefaults as coreSetEnvDefaults } from "@auth/core"

/** If `NEXTAUTH_URL` or `AUTH_URL` is defined or host headers are set,
 * override the request's URL.
 */
export function reqWithEnvURL(req: NextRequest): NextRequest {
  const rawUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? urlFromHeaders(req)

  console.log("[NextAuth Debug] reqWithEnvURL called")
  console.log("[NextAuth Debug] - Raw AUTH_URL:", process.env.AUTH_URL)
  console.log("[NextAuth Debug] - Raw NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
  console.log("[NextAuth Debug] - Request pathname:", req.nextUrl.pathname)
  console.log("[NextAuth Debug] - Request search:", req.nextUrl.search)

  if (!rawUrl) {
    console.log(
      "[NextAuth Debug] - No URL configured, returning original request"
    )
    return req
  }

  try {
    // Normalize URL: strip /api/auth suffix (if present) and trailing slashes
    // This allows AUTH_URL to be set as either the base app URL or the full auth endpoint
    const normalizedUrl = rawUrl
      .replace(/\/api\/auth\/?$/, "") // Remove /api/auth or /api/auth/
      .replace(/\/+$/, "") // Remove any trailing slashes

    console.log("[NextAuth Debug] - Normalized URL:", normalizedUrl)

    const envUrl = new URL(normalizedUrl)
    const envPathname = envUrl.pathname

    console.log("[NextAuth Debug] - Env pathname component:", envPathname)

    // If env URL has a pathname (e.g., /dev/conductor), use it as base for all routes
    if (envPathname !== "/") {
      const finalUrl = `${envUrl.origin}${envPathname}${req.nextUrl.pathname}${req.nextUrl.search}`
      console.log("[NextAuth Debug] - Final URL (with base path):", finalUrl)
      return new NextRequest(finalUrl, req)
    }

    // Otherwise, just replace the origin (no base path)
    const { href, origin } = req.nextUrl
    const finalUrl = href.replace(origin, envUrl.origin)
    console.log("[NextAuth Debug] - Final URL (origin only):", finalUrl)
    return new NextRequest(finalUrl, req)
  } catch (error) {
    console.error("[NextAuth Debug] - Error parsing AUTH_URL:", error)
    console.log("[NextAuth Debug] - Returning original request due to error")
    return req
  }
}

/**
 * For backwards compatibility, `next-auth` checks for `NEXTAUTH_URL`
 * and the `basePath` by default is `/api/auth` instead of `/auth`
 * (which is the default for all other Auth.js integrations).
 *
 * For the same reason, `NEXTAUTH_SECRET` is also checked.
 */
export function setEnvDefaults(config: NextAuthConfig) {
  console.log("[NextAuth Debug] setEnvDefaults called")
  console.log("[NextAuth Debug] - initial config.basePath:", config.basePath)
  console.log("[NextAuth Debug] - AUTH_URL:", process.env.AUTH_URL)
  console.log("[NextAuth Debug] - NEXTAUTH_URL:", process.env.NEXTAUTH_URL)

  try {
    config.secret ??= process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
    if (!url) {
      console.log(
        "[NextAuth Debug] - no AUTH_URL/NEXTAUTH_URL, skipping pathname extraction"
      )
      return
    }
    const { pathname } = new URL(url)
    console.log("[NextAuth Debug] - extracted pathname from URL:", pathname)
    if (pathname === "/") {
      console.log(
        "[NextAuth Debug] - pathname is /, not setting basePath from URL"
      )
      return
    }
    config.basePath ||= pathname
    console.log(
      "[NextAuth Debug] - set config.basePath to pathname:",
      config.basePath
    )
  } catch (error) {
    console.log("[NextAuth Debug] - error parsing URL:", error)
    // Catching and swallowing potential URL parsing errors, we'll fall
    // back to `/api/auth` below.
  } finally {
    config.basePath ||= "/api/auth"
    console.log("[NextAuth Debug] - final config.basePath:", config.basePath)
    coreSetEnvDefaults(process.env, config, true)
  }
}

function urlFromHeaders(req: NextRequest): string | null {
  const detectedHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host")

  console.log("[NextAuth Debug] urlFromHeaders called")
  console.log(
    "[NextAuth Debug] - x-forwarded-host:",
    req.headers.get("x-forwarded-host")
  )
  console.log("[NextAuth Debug] - host:", req.headers.get("host"))

  if (!detectedHost) {
    console.log("[NextAuth Debug] - no host detected, returning null")
    return null
  }

  const detectedProtocol =
    req.headers.get("x-forwarded-proto") ?? req.protocol ?? "https"
  console.log(
    "[NextAuth Debug] - x-forwarded-proto:",
    req.headers.get("x-forwarded-proto")
  )
  console.log("[NextAuth Debug] - detectedProtocol:", detectedProtocol)

  const _protocol = detectedProtocol.endsWith(":")
    ? detectedProtocol
    : detectedProtocol + ":"
  const finalUrl = `${_protocol}//${detectedHost}`
  console.log("[NextAuth Debug] - urlFromHeaders result:", finalUrl)
  return finalUrl
}
