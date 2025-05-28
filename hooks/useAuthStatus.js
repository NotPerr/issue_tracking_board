"use client";
import { useSession } from "next-auth/react";
const REPO_OWNER_GITHUB_ID = process.env.NEXT_PUBLIC_REPO_OWNER_GITHUB_ID;

export function useAuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isAuthor =
    isAuthenticated && session?.githubId === REPO_OWNER_GITHUB_ID;
  return {
    session,
    isLoading,
    isAuthenticated,
    isAuthor,
    status, // You might still want the raw status string
  };
}
