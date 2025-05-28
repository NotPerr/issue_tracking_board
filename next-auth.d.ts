// next-auth.d.ts
import { DefaultSession, DefaultJWT } from "next-auth";
// No need to import DefaultProfile here directly, it's used implicitly by GitHubProfile

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    // Extend the default user properties with your custom 'username'
    user: DefaultSession["user"] & {
      username?: string; // Add custom username property
    };
    // Add other custom properties directly to the session root
    accessToken?: string; // GitHub access token
    githubId?: string; // GitHub user ID
  }

  /**
   * Returned by the `jwt` callback and `getToken`, and exposed through `session.token`
   */
  interface JWT extends DefaultJWT {
    accessToken?: string; // GitHub access token
    githubId?: string; // GitHub user ID
    username?: string; // GitHub username
  }
}

// Extend the GitHub Profile interface if you need specific properties from it
declare module "next-auth/providers/github" {
  // `DefaultProfile` is implicitly extended when you extend the provider's interface.
  // We explicitly add 'login' and 'id' as they are specific to GitHub's profile response.
  interface GitHubProfile {
    login: string; // Add 'login' which is the GitHub username
    id: number; // GitHub ID
    // You might also need other fields from GitHub's profile response like 'node_id', 'avatar_url', etc.
    // If you use them, you'd add them here with their respective types.
  }
}
