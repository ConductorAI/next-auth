// @ts-expect-error Next.js does not yet correctly use the `package.json#exports` field
import { NextRequest } from "next/server"
import type { NextAuthConfig } from "./index.js"
import { setEnvDefaults as coreSetEnvDefaults } from "@conductorai/auth-core"

function urlFromHeaders(req: NextRequest): string | null {
  const detectedHost =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host")

  if (!detectedHost) {
    return null
  }

  const detectedProtocol =
    req.headers.get("x-forwarded-proto") ?? req.protocol ?? "https"
  const _protocol = detectedProtocol.endsWith(":")
    ? detectedProtocol
    : detectedProtocol + ":"
  return `${_protocol}//${detectedHost}`
  // return "https://auth.conductor.ai"
}

/** If `NEXTAUTH_URL` or `AUTH_URL` is defined, override the request's URL. */
export function reqWithEnvURL(req: NextRequest): NextRequest {
  console.log("REQ IN env.ts next-auth package")
  // print the time to seconds
  console.log("Time: ", new Date().toLocaleTimeString())
  // log headers
  console.log("headers", req.headers)
  console.log("********************")
  const url =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? urlFromHeaders(req)
  if (!url) return req
  const { origin: envOrigin } = new URL(url)
  const { href, origin } = req.nextUrl
  console.log("envOrigin", envOrigin)
  console.log("href", href)
  console.log(href.replace(origin, envOrigin))
  return new NextRequest(href.replace(origin, envOrigin), req)
}

/**
 * For backwards compatibility, `next-auth` checks for `NEXTAUTH_URL`
 * and the `basePath` by default is `/api/auth` instead of `/auth`
 * (which is the default for all other Auth.js integrations).
 *
 * For the same reason, `NEXTAUTH_SECRET` is also checked.
 */
export function setEnvDefaults(config: NextAuthConfig) {
  try {
    config.secret ??= process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
    const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
    if (!url) return
    const { pathname } = new URL(url)
    if (pathname === "/") return
    config.basePath ||= pathname
  } catch {
    // Catching and swallowing potential URL parsing errors, we'll fall
    // back to `/api/auth` below.
  } finally {
    config.basePath ||= "/api/auth"
    coreSetEnvDefaults(process.env, config, true)
  }
}
