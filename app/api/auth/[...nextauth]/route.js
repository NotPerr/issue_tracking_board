// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const GITHUB_CLIENT_ID = process.env.CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.CLIENT_SECRET;
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

if (!GITHUB_CLIENT_ID) {
  throw new Error("GITHUB_CLIENT_ID is not set in environment variables.");
}
if (!GITHUB_CLIENT_SECRET) {
  throw new Error("GITHUB_CLIENT_SECRET is not set in environment variables.");
}
if (!NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET is not set in environment variables. Please generate a strong random string."
  );
}

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      authorization: {
        params: { scope: "repo user:email" },
      },
    }),
  ],
  secret: NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("--- JWT Callback ---");
      console.log("Initial Token:", token);
      console.log("Account (during login):", account);
      console.log("Profile (during login):", profile); // This is where GitHub's user data comes from

      if (account) {
        token.accessToken = account.access_token;
        if (profile) {
          console.log("Profile ID:", profile.id);
          console.log("Profile Login:", profile.login);

          token.githubId = String(profile.id);
          token.username = profile.login;
        } else {
          console.warn("JWT Callback: 'profile' object is missing or empty.");
        }
      } else {
        console.log(
          "JWT Callback: Not an initial login, account is undefined."
        );
      }

      console.log("Token after modifications in JWT:", token);
      console.log("--------------------");
      return token;
    },

    async session({ session, token }) {
      console.log("--- SESSION Callback ---");
      console.log("Token received in Session Callback:", token);

      // Ensure that 'accessToken', 'githubId', and 'username' are actually present on the 'token'
      // before assigning them to 'session'.
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      } else {
        console.warn("Session Callback: accessToken is missing from token.");
      }

      if (token.githubId) {
        session.githubId = token.githubId;
      } else {
        console.warn("Session Callback: githubId is missing from token.");
      }

      if (token.username) {
        session.username = token.username;
        // Also ensure session.user.username is set if you rely on session.user?.username
        if (session.user) {
          session.user.username = token.username;
        }
      } else {
        console.warn("Session Callback: username is missing from token.");
      }

      console.log("Session after modifications in Session:", session);
      console.log("------------------------");
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
