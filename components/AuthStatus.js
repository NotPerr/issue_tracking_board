"use client";
import { signIn, signOut } from "next-auth/react";
import React from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import StatusLoading from "./loading/StatusLoading";

export default function AuthStatus() {
  const { session, isLoading, isAuthenticated, isAuthor } = useAuthStatus();
  if (isLoading) {
    return <StatusLoading />;
  }

  if (session) {
    // User is authenticated
    const username = session.user?.name || session.username;

    if (isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-green-100 rounded-lg shadow-lg">
          <p className="text-green-800 text-xl font-bold mb-3">
            Signed in as <span className="text-green-900">{username}</span>
          </p>
          {isAuthor ? (
            <p className="text-green-700 text-lg font-medium mb-4">
              You are the{" "}
              <span className="text-green-900 font-bold">repository owner</span>
              ! You have full access.
            </p>
          ) : (
            <p className="text-green-700 text-lg font-medium mb-4">
              You are a{" "}
              <span className="text-green-900 font-bold">guest user</span>. You
              can only browse.
            </p>
          )}
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105"
          >
            Sign out
          </button>
        </div>
      );
    }
  }

  // User is not authenticated
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg shadow-lg">
      <p className="text-gray-800 text-xl font-bold mb-4">Not signed in</p>
      <button
        onClick={() => signIn("github", { prompt: "login" })} // Call signIn with 'github' provider
        className="px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
