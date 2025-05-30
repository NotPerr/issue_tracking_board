// components/IssueList.js
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import IssueItem from "@/components/IssueItem";
import { useAuthStatus } from "@/hooks/useAuthStatus"; // To get the accessToken

// IMPORTANT: Replace with your actual GitHub repository owner and name
//const ISSUES_PER_FETCH = 10; // Number of issues to fetch at a time

export default function IssueList({ refreshListKey, onIssueAction }) {
  const { status } = useAuthStatus(); // Get session for accessToken
  //const accessToken = session?.accessToken;

  const [issues, setIssues] = useState([]);
  const [endCursor, setEndCursor] = useState(null); // Cursor for GraphQL pagination
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true); // Indicates if there are more pages to load
  const [isAuthStatusChecked, setIsAuthStatusChecked] = useState(false);
  const loader = useRef(null); // Ref for the element at the bottom of the list

  // Wrap fetchIssues in useCallback to prevent unnecessary re-creation
  const fetchIssues = useCallback(
    async (cursorToUse = null, isInitialFetch = false) => {
      console.log("fetch issue");

      // Prevent multiple fetches for subsequent pages if already loading or no more data
      if (!isInitialFetch && (isLoading || !hasMore)) {
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
        if (!response.ok) {
          console.error("Error from local API:", data.error);
          throw new Error(
            data.error || "Failed to fetch issues from local API."
          );
        }

        const issuesData = data;

        setIssues((prevIssues) => {
          if (cursorToUse === null || isInitialFetch) {
            return issuesData.nodes; // New issues for initial load
          }
          const uniqueNewNodes = issuesData.nodes.filter(
            (newNode) =>
              !prevIssues.some((oldNode) => oldNode.id === newNode.id)
          );
          return [...prevIssues, ...uniqueNewNodes];
        });

        setEndCursor(issuesData.pageInfo.endCursor);
        setHasMore(issuesData.pageInfo.hasNextPage);
      } catch (err) {
        console.error("Client-side error fetching issues from API:", err);
        setError(err.message || "Failed to load blog posts.");
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, hasMore]
  ); // Dependencies for useCallback

  // Initial fetch when component mounts or refresh key changes
  useEffect(() => {
    // This effect should trigger a fetch whenever the auth status is known,
    // or when a refresh is requested.
    if (status !== "loading" && !isAuthStatusChecked) {
      setIsAuthStatusChecked(true); // Mark that we've checked auth status
      // Reset state for a fresh fetch
      setIssues([]);
      setEndCursor(null);
      setHasMore(true);
      setError(null);
      fetchIssues(null, true); // Always attempt to fetch the first page
    }
  }, [refreshListKey, fetchIssues, status, isAuthStatusChecked]);

  // Intersection Observer for infinite scrolling
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-lg text-gray-600">
          Checking authentication for issue access...
        </p>
      </div>
    );
  }

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
            Please sign in to view posts, as GitHub GraphQL API often requires
            authentication.
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
    <div className="w-full mt-8 space-y-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        All Blog Posts
      </h2>
      {issues.map((issue) => (
        <IssueItem key={issue.id} issue={issue} onIssueAction={onIssueAction} />
      ))}
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
