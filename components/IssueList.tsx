/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import IssueItem from "@/components/IssueItem";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { IssueNode } from "@/types/github";

interface IssueListProps {
  initialIssues: IssueNode[];
  initialEndCursor: string | null;
  initialHasNextPage: boolean;
  refreshListKey: number;
}

export default function IssueList({
  initialIssues,
  initialEndCursor,
  initialHasNextPage,
  refreshListKey,
}: IssueListProps) {
  const { status } = useAuthStatus(); // Get session for accessToken

  const [issues, setIssues] = useState<IssueNode[]>(initialIssues);
  const [endCursor, setEndCursor] = useState<string | null>(initialEndCursor); // Cursor for GraphQL pagination
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasNextPage);
  const loader = useRef<HTMLDivElement>(null); // Ref for the element at the bottom of the list
  // Use a ref to track if it's the very first render of this component.
  // This helps prevent `useEffect` from running on mount if `initialIssues` already provides data.
  const isMounted = useRef(false);
  const fetchIssues = useCallback(
    async (
      cursorToUse: string | null = null,
      isFullRefresh: boolean = false
    ) => {
      console.log("IssueList: Fetch triggered.");

      if (!isFullRefresh && (isLoading || !hasMore)) {
        console.log("IssueList: Skipping fetch (loading or no more data).");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiUrl = `/api/public-issues${
          cursorToUse ? `?after=${cursorToUse}` : ""
        }`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(
            data.error || "Failed to fetch issues from local API."
          );
        }

        if (!data.nodes || !data.pageInfo) {
          throw new Error(
            "Invalid data structure received from /api/public-issues."
          );
        }

        setIssues((prevIssues) => {
          if (isFullRefresh) {
            return data.nodes;
          }
          const uniqueNewNodes = data.nodes.filter(
            (newNode: IssueNode) =>
              !prevIssues.some((oldNode) => oldNode.id === newNode.id)
          );
          return [...prevIssues, ...uniqueNewNodes];
        });

        setEndCursor(data.pageInfo.endCursor);
        setHasMore(data.pageInfo.hasNextPage);
      } catch (err: any) {
        console.error("Client-side error fetching issues:", err);
        setError(err.message || "Failed to load blog posts.");
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // --- Effect for Refreshing (triggered by refreshListKey) ---
  useEffect(() => {
    // Set isMounted to true after the first render.
    // This ensures the effect doesn't run on the very first mount.
    if (!isMounted.current) {
      isMounted.current = true;
      return; // Skip the first render
    }
    // Reset state to clear current issues and prepare for a fresh fetch
    setIssues([]);
    setEndCursor(null);
    setHasMore(true);
    setError(null);
    fetchIssues(null, true); // Perform a full re-fetch from the beginning
  }, [refreshListKey, fetchIssues]);

  // --- Effect for Infinite Scrolling (Intersection Observer) ---
  useEffect(() => {
    const options = {
      root: null, // Use the viewport as the root
      rootMargin: "20px", // Trigger when 20px from the bottom of the viewport
      threshold: 1.0, // Trigger when 100% of the target is visible
    };

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      // If the target is intersecting, not currently loading, and there's more data
      if (target.isIntersecting && !isLoading && hasMore) {
        fetchIssues(endCursor); // Fetch next page using the current endCursor
      }
    }, options);

    if (loader.current) {
      observer.observe(loader.current); // Start observing the loader element
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current); // Clean up observer on component unmount
      }
    };
  }, [isLoading, hasMore, endCursor, fetchIssues]); // Re-run effect if dependencies change

  // Show initial loading state only if no issues are loaded yet
  if (isLoading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-lg text-gray-600">Loading blog posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-red-600">
        <p className="text-lg">Error loading blog posts: {error}</p>
        {status === "unauthenticated" && (
          <p className="text-sm text-gray-500 mt-2">
            GitHub GraphQL API often requires authentication.
          </p>
        )}
      </div>
    );
  }

  if (issues.length === 0 && !isLoading && !error) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-lg text-gray-600">No blog posts found.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4 max-w-full ">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        All Blog Posts
      </h2>
      <div className="grid p-5 w-full grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-x-2">
        {issues.map((issue) => (
          <IssueItem key={issue.id} issue={issue} />
        ))}
      </div>

      {/* Loading indicator for subsequent pages */}
      {hasMore && isLoading && issues.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <p className="text-lg text-gray-600">Loading more posts...</p>
        </div>
      )}
      {/* Message when all issues are loaded */}
      {!hasMore && !isLoading && issues.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <p className="text-lg text-gray-600">No more posts to load.</p>
        </div>
      )}

      {/* This invisible div acts as the trigger for the IntersectionObserver */}
      {hasMore && <div ref={loader} className="h-1 bg-transparent" />}
    </div>
  );
}
