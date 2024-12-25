import { UnknownAction } from "../errors.js"
import { SessionStore } from "./utils/cookie.js"
import { init } from "./init.js"
import renderPage from "./pages/index.js"
import * as actions from "./actions/index.js"
import { validateCSRF } from "./actions/callback/oauth/csrf-token.js"

import type { RequestInternal, ResponseInternal } from "../types.js"
import type { AuthConfig } from "../index.js"
import { skipCSRFCheck } from "./symbols.js"

export { customFetch, raw, skipCSRFCheck } from "./symbols.js"

/** @internal */
export async function AuthInternal(
  request: RequestInternal,
  authOptions: AuthConfig
): Promise<ResponseInternal> {
  const { action, providerId, error, method } = request

  const csrfDisabled = authOptions.skipCSRFCheck === skipCSRFCheck

  console.log("request", request)
  console.log("url to string", request.url.toString())
  console.log("url raw", request.url)
  console.log("happy line in console")
  console.log("headers", request.headers)

  // THE BUILT VERSION OF THIS IS STALE FOR SOME REASON. MAYBE IT NEEDS A COMMIT????
  // ^ it's not the commit thing, for some reason this isn't rebuilding with the release thing. (MAYBE it's because the npm run dev in root stopped happening? We need to think through this)

  // let url = request.url
  const url = request.url

  // if (request.headers) {
  //   const detectedHost =
  //     request.headers["x-forwarded-host"] ?? request.headers["host"]
  //   const detectedProtocol = request.headers["x-forwarded-proto"] ?? "https"
  //   const _protocol = detectedProtocol.endsWith(":")
  //     ? detectedProtocol
  //     : detectedProtocol + ":"

  //   url = new URL(`${_protocol}//${detectedHost}`)
  // }

  console.log("url", url)

  const { options, cookies } = await init({
    authOptions,
    action,
    providerId,
    // url: request.url, // This is 0.0.0.0 I believe and the source of our issues
    url: url,
    callbackUrl: request.body?.callbackUrl ?? request.query?.callbackUrl,
    csrfToken: request.body?.csrfToken,
    cookies: request.cookies,
    isPost: method === "POST",
    csrfDisabled,
  })

  const sessionStore = new SessionStore(
    options.cookies.sessionToken,
    request.cookies,
    options.logger
  )

  if (method === "GET") {
    const render = renderPage({ ...options, query: request.query, cookies })
    switch (action) {
      case "callback":
        return await actions.callback(request, options, sessionStore, cookies)
      case "csrf":
        return render.csrf(csrfDisabled, options, cookies)
      case "error":
        return render.error(error)
      case "providers":
        return render.providers(options.providers)
      case "session":
        return await actions.session(options, sessionStore, cookies)
      case "signin":
        return render.signin(providerId, error)
      case "signout":
        return render.signout()
      case "verify-request":
        return render.verifyRequest()
      case "webauthn-options":
        return await actions.webAuthnOptions(
          request,
          options,
          sessionStore,
          cookies
        )
      default:
    }
  } else {
    const { csrfTokenVerified } = options
    switch (action) {
      case "callback":
        if (options.provider.type === "credentials")
          // Verified CSRF Token required for credentials providers only
          validateCSRF(action, csrfTokenVerified)
        return await actions.callback(request, options, sessionStore, cookies)
      case "session":
        validateCSRF(action, csrfTokenVerified)
        return await actions.session(
          options,
          sessionStore,
          cookies,
          true,
          request.body?.data
        )
      case "signin":
        validateCSRF(action, csrfTokenVerified)
        return await actions.signIn(request, cookies, options)

      case "signout":
        validateCSRF(action, csrfTokenVerified)
        return await actions.signOut(cookies, sessionStore, options)
      default:
    }
  }
  throw new UnknownAction(`Cannot handle action: ${action}`)
}
