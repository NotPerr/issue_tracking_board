// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import { authOptions } from "../../../../lib/auth";

// const GITHUB_CLIENT_ID = process.env.CLIENT_ID;
// const GITHUB_CLIENT_SECRET = process.env.CLIENT_SECRET;
// const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

// if (!GITHUB_CLIENT_ID) {
//   throw new Error("GITHUB_CLIENT_ID is not set in environment variables.");
// }
// if (!GITHUB_CLIENT_SECRET) {
//   throw new Error("GITHUB_CLIENT_SECRET is not set in environment variables.");
// }
// if (!NEXTAUTH_SECRET) {
//   throw new Error(
//     "NEXTAUTH_SECRET is not set in environment variables. Please generate a strong random string."
//   );
// }

// export const authOptions = {
//   providers: [
//     GithubProvider({
//       clientId: GITHUB_CLIENT_ID,
//       clientSecret: GITHUB_CLIENT_SECRET,
//       authorization: {
//         params: { scope: "repo user:email" },
//       },
//     }),
//   ],
//   secret: NEXTAUTH_SECRET,
//   callbacks: {
//     async jwt({ token, account, profile }) {
//       if (account) {
//         token.accessToken = account.access_token;
//         if (profile) {
//           token.githubId = String(profile.id);
//           token.username = profile.login;
//         } else {
//           console.warn("JWT Callback: 'profile' object is missing or empty.");
//         }
//       } else {
//         console.log(
//           "JWT Callback: Not an initial login, account is undefined."
//         );
//       }
//       console.log("--------------------");
//       return token;
//     },

//     async session({ session, token }) {
//       // Ensure that 'accessToken', 'githubId', and 'username' are actually present on the 'token'
//       // before assigning them to 'session'.
//       if (token.accessToken) {
//         session.accessToken = token.accessToken;
//       } else {
//         console.warn("Session Callback: accessToken is missing from token.");
//       }

//       if (token.githubId) {
//         session.githubId = token.githubId;
//       } else {
//         console.warn("Session Callback: githubId is missing from token.");
//       }

//       if (token.username) {
//         session.username = token.username;
//         // Also ensure session.user.username is set if you rely on session.user?.username
//         if (session.user) {
//           session.user.username = token.username;
//         }
//       } else {
//         console.warn("Session Callback: username is missing from token.");
//       }
//       return session;
//     },
//   },
// };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
