import decode from "jwt-decode";
import NextAuth, { NextAuthOptions } from "next-auth"
import Auth0Provider from "next-auth/providers/auth0"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import GithubProvider from "next-auth/providers/github"
import TwitterProvider from "next-auth/providers/twitter"
import CognitoProvider from "next-auth/providers/cognito";

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  is_active: boolean;
  system_role: number | null;
  impersonated: boolean;
  impersonated_at: string | null;
  token: string;
};
interface IToken {
  iss: string;
  iat: number;
  jti: string;
  user: User;
}

interface IRefreshToken {
  access_token: string;
  expires_at: number;
  refresh_token: string;
  token_type: string;
}

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.PROVIDER_URL}/oauth/token?client_id=${process.env.CONFIDENTIAL_CLIENT_ID}&client_secret=${process.env.CONFIDENTIAL_CLIENT_SECRET}&refresh_token=${token.refreshToken}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = (await response.json()) as IRefreshToken;

    // if (!response.ok) {
    //   throw refreshedTokens;
    // }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_at * 1000,
      // Fall back to old refresh token
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("refreshAccessToken error: ", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}


// import AppleProvider from "next-auth/providers/apple"
// import EmailProvider from "next-auth/providers/email"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [

    /* EmailProvider({
         server: process.env.EMAIL_SERVER,
         from: process.env.EMAIL_FROM,
       }),
    // Temporarily removing the Apple provider from the demo site as the
    // callback URL for it needs updating due to Vercel changing domains

    Providers.Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: {
        appleId: process.env.APPLE_ID,
        teamId: process.env.APPLE_TEAM_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        keyId: process.env.APPLE_KEY_ID,
      },
    }),
    */
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_ID,
    //   clientSecret: process.env.FACEBOOK_SECRET,
    // }),
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_ID,
    //   clientSecret: process.env.GOOGLE_SECRET,
    // }),
    // TwitterProvider({
    //   clientId: process.env.TWITTER_ID,
    //   clientSecret: process.env.TWITTER_SECRET,
    // }),
    // {
    //   id: "theleadershipcircle",
    //   name: "The Leadership Circle",
    //   type: "oauth",
    //   version: "2.0",
    //   idToken: false,
    //   async profile(profile: any, tokens) {
    //     const verify = await decode(tokens.access_token || "");

    //     const user = (verify as IToken).user;

    //     const {
    //       id,
    //       email,
    //       first_name: firstName,
    //       last_name: lastName,
    //       system_role: systemRole,
    //       impersonated,
    //       impersonated_at: impersonatedAt,
    //     } = user;

    //     const additionalInfo: string = JSON.stringify({
    //       systemRole,
    //       impersonated,
    //       impersonatedAt,
    //     });

    //     return {
    //       id: "" + id,
    //       name: firstName + " " + lastName,
    //       email,
    //       image: additionalInfo,
    //     };
    //   },
    //   clientId: process.env.CONFIDENTIAL_CLIENT_ID || "",
    //   clientSecret: process.env.CONFIDENTIAL_CLIENT_SECRET || "",
    //   authorization: {
    //     url: `${process.env.PROVIDER_URL}/oauth/authorize`,
    //     params: {
    //       grand_type: "authorization_code",
    //       scope: "read update",
    //       //scope: "read",
    //       // scope: "email openid",
    //     },
    //   },
    //   token: `${process.env.PROVIDER_URL}/oauth/token`,
    //   userinfo: `${process.env.PROVIDER_URL}/oauth/token/info`,
    //   checks: "none",
    //   // checks: ["state"],
    // },
    Auth0Provider({
      clientId: process.env.AUTH0_ID,
      clientSecret: process.env.AUTH0_SECRET,
      issuer: process.env.AUTH0_ISSUER,
    }),
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    }),

  ],
  theme: {
    colorScheme: "light",
  },
  // callbacks: {
  //   async jwt({ token }) {
  //     token.userRole = "admin"
  //     return token
  //   },
  // },
  session: {
    updateAge: 0,
  },
  debug: true,
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial login
      if (account && user) {
        return {
          ...token,
          picture: user.image,
          id: user?.id || token?.id,
          accessToken: account?.access_token || token.accessToken,
        };
      }
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token?.exp as number) * 1000 - 5 * 60 * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      const decodedToken: IToken = await decode((token?.accessToken as string) || "");
      return {
        user: {
          ...decodedToken.user,
          token: token?.accessToken,
        },
        expires: session.expires,
      };
    },
  },
  // callbacks: {
  //   async jwt({ token, account }) {
  //     // Persist the OAuth access_token to the token right after signin
  //     if (account) {
  //       token.accessToken = account.access_token
  //     }
  //     return token
  //   },
  //   async session({ session, token, user }) {
  //     // Send properties to the client, like an access_token from a provider.
  //     //session.accessToken = token.accessToken
  //     session.user = user
  //     return session
  //   }
  // }
}

export default NextAuth(authOptions)
