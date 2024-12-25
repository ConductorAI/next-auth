import { Auth, setEnvDefaults, type AuthConfig } from "@conductorai/auth-core"
import Apple from "@conductorai/auth-core/providers/apple"
import Auth0 from "@conductorai/auth-core/providers/auth0"
import AzureB2C from "@conductorai/auth-core/providers/azure-ad-b2c"
import BankId from "@conductorai/auth-core/providers/bankid-no"
import BoxyHQSAML from "@conductorai/auth-core/providers/boxyhq-saml"
import Cognito from "@conductorai/auth-core/providers/cognito"
import Coinbase from "@conductorai/auth-core/providers/coinbase"
import Discord from "@conductorai/auth-core/providers/discord"
import Dropbox from "@conductorai/auth-core/providers/dropbox"
import Facebook from "@conductorai/auth-core/providers/facebook"
import GitHub from "@conductorai/auth-core/providers/github"
import GitLab from "@conductorai/auth-core/providers/gitlab"
import Google from "@conductorai/auth-core/providers/google"
import Hubspot from "@conductorai/auth-core/providers/hubspot"
import Keycloak from "@conductorai/auth-core/providers/keycloak"
import LinkedIn from "@conductorai/auth-core/providers/linkedin"
import MicrosoftEntraId from "@conductorai/auth-core/providers/microsoft-entra-id"
import Netlify from "@conductorai/auth-core/providers/netlify"
import Okta from "@conductorai/auth-core/providers/okta"
import Passage from "@conductorai/auth-core/providers/passage"
import Pinterest from "@conductorai/auth-core/providers/pinterest"
import Reddit from "@conductorai/auth-core/providers/reddit"
import Salesforce from "@conductorai/auth-core/providers/salesforce"
import Slack from "@conductorai/auth-core/providers/slack"
import Spotify from "@conductorai/auth-core/providers/spotify"
import Twitch from "@conductorai/auth-core/providers/twitch"
import Twitter from "@conductorai/auth-core/providers/twitter"
import Vipps from "@conductorai/auth-core/providers/vipps"
import WorkOS from "@conductorai/auth-core/providers/workos"
import Zoom from "@conductorai/auth-core/providers/zoom"

const authConfig: AuthConfig = {
  providers: [
    Apple,
    Auth0,
    AzureB2C,
    BankId,
    BoxyHQSAML({
      clientId: "dummy",
      clientSecret: "dummy",
      issuer: process.env.AUTH_BOXYHQ_SAML_ISSUER,
    }),
    Cognito,
    Coinbase,
    Discord,
    Dropbox,
    Facebook,
    GitHub,
    GitLab,
    Google,
    Hubspot,
    Keycloak,
    LinkedIn,
    MicrosoftEntraId,
    Netlify,
    Okta,
    Passage,
    Pinterest,
    Reddit,
    Salesforce,
    Slack,
    Spotify,
    Twitch,
    Twitter,
    Vipps,
    WorkOS,
    Zoom,
    {
      id: "tiktok",
      name: "TikTok",
      type: "oauth",
      checks: ["state"],
      clientId: process.env.AUTH_TIKTOK_ID,
      clientSecret: process.env.AUTH_TIKTOK_SECRET,
      authorization: {
        url: "https://www.tiktok.com/v2/auth/authorize",
        params: {
          client_key: process.env.AUTH_TIKTOK_ID,
          scope: "user.info.basic",
        },
      },
      token: "https://open.tiktokapis.com/v2/oauth/token/",
      userinfo:
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username",
      profile(profile: any) {
        return profile
      },
      style: {
        bg: "#000",
        text: "#fff",
      },
    },
  ],
  basePath: "/api",
}
setEnvDefaults(process.env, authConfig)

export default function handler(req: Request) {
  return Auth(req, authConfig)
}

export const config = { runtime: "edge" }
