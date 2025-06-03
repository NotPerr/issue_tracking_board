/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/github.ts
import { IssueDataResponse } from "@/types/github"; // Import the shared type

// Server-side fetching function that calls your local API route
export async function getIssues(
  cursor: string | null = null
): Promise<IssueDataResponse> {
  try {
    // Construct the API URL for your local public-issues endpoint
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error(
        "NEXT_PUBLIC_APP_URL is not defined in environment variables."
      );
      return {
        nodes: [],
        pageInfo: { endCursor: null, hasNextPage: false },
        error: "Application URL not configured.",
      };
    }

    const apiUrl = `${appUrl}/api/public-issues${
      cursor ? `?after=${cursor}` : ""
    }`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 }, // Opt-out of ISR cache for fresh data on initial load
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from local API (server-side):", data.error);
      throw new Error(data.error || "Failed to fetch issues from local API.");
    }

    // Ensure the returned data matches the IssueDataResponse structure
    if (!data.nodes || !data.pageInfo) {
      throw new Error(
        "Invalid data structure received from /api/public-issues."
      );
    }

    return {
      nodes: data.nodes,
      pageInfo: data.pageInfo,
    };
  } catch (err: any) {
    console.error("Server-side error fetching issues:", err);
    return {
      nodes: [],
      pageInfo: { endCursor: null, hasNextPage: false },
      error: err.message || "Failed to fetch issues.",
    };
  }
}
