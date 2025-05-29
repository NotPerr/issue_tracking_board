// components/IssueList.js
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import IssueItem from "@/components/IssueItem";
import { useAuthStatus } from "@/hooks/useAuthStatus"; // To get the accessToken

// IMPORTANT: Replace with your actual GitHub repository owner and name
const GITHUB_REPO_OWNER = "NotPerr"; // Your GitHub username
const GITHUB_REPO_NAME = "issue_tracking_board"; // Your repository name
const ISSUES_PER_FETCH = 10; // Number of issues to fetch at a time
const COMMENTS_PER_ISSUE = 5;

export default function IssueList({ refreshListKey, onIssueAction }) {
  const { session, status } = useAuthStatus(); // Get session for accessToken
  const accessToken = session?.accessToken;

  const [issues, setIssues] = useState([]);
  const [endCursor, setEndCursor] = useState(null); // Cursor for GraphQL pagination
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true); // Indicates if there are more pages to load

  const loader = useRef(null); // Ref for the element at the bottom of the list

  // GraphQL query string
  // 'states: OPEN' or 'states: CLOSED' or 'states: [OPEN, CLOSED]'
  // Adjust 'states' as needed. For "all issues", use [OPEN, CLOSED].
  // The 'bodyHTML' field can be useful if you want pre-rendered HTML.
  const ISSUE_LIST_QUERY = `
    query GetRepoIssues($owner: String!, $repo: String!, $first: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        issues(first: $first, after: $after, states: [OPEN], orderBy: {field: CREATED_AT, direction: DESC}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            number
            title
            body
            createdAt
            url
            state
            author {
              login
              url
            }
            labels(first: 5) {
              nodes {
                name
                color
              }
            }
              comments(first: ${COMMENTS_PER_ISSUE}, orderBy: {field: UPDATED_AT, direction: DESC}) {
             nodes {
                id
                author {
                  login
                  url
                }
                bodyHTML
                createdAt
                updatedAt
              }
              totalCount
            }
          }
        }
      }
    }
  `;

  // Wrap fetchIssues in useCallback to prevent unnecessary re-creation
  const fetchIssues = useCallback(
    async (cursorToUse = null, isInitialFetch = false) => {
      console.log("fetch issue");
      // Early exit if session isn't ready or if we don't have an accessToken
      if (status === "loading" || !accessToken) {
        if (status !== "loading") {
          // Only set error if not actively loading auth status
          setError(
            "Authentication token required to fetch issues via GraphQL."
          );
          setHasMore(false);
        }
        return;
      }
      // Prevent multiple fetches for subsequent pages if already loading or no more data
      if (!isInitialFetch && (isLoading || !hasMore)) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v4.graphql",
          },
          body: JSON.stringify({
            query: ISSUE_LIST_QUERY,
            variables: {
              owner: GITHUB_REPO_OWNER,
              repo: GITHUB_REPO_NAME,
              first: ISSUES_PER_FETCH,
              after: cursorToUse,
            },
          }),
        });

        const result = await response.json();

        if (!response.ok || result.errors) {
          console.error("GraphQL Errors:", result.errors);
          throw new Error(
            result.errors?.[0]?.message || "Failed to fetch issues via GraphQL."
          );
        }

        const issuesData = result.data.repository.issues;
        const newNodes = issuesData.nodes;
        const pageInfo = issuesData.pageInfo;

        setIssues((prevIssues) => {
          // If it's an initial fetch (first page), replace the list
          if (cursorToUse === null) {
            return newNodes;
          }
          // Otherwise, append new items, filtering duplicates
          const uniqueNewNodes = newNodes.filter(
            (newNode) =>
              !prevIssues.some((oldNode) => oldNode.id === newNode.id)
          );
          return [...prevIssues, ...uniqueNewNodes];
        });

        setEndCursor(pageInfo.endCursor);
        setHasMore(pageInfo.hasNextPage);
      } catch (err) {
        console.error("Error fetching issues:", err);
        setError(err.message || "Failed to load issues.");
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [
      accessToken,
      status,
      GITHUB_REPO_OWNER,
      GITHUB_REPO_NAME,
      ISSUES_PER_FETCH,
      ISSUE_LIST_QUERY,
    ]
  ); // Dependencies for useCallback

  // Initial fetch when component mounts or accessToken becomes available
  useEffect(() => {
    // Only fetch if session is authenticated and accessToken is ready
    if (status === "authenticated" && accessToken) {
      // Reset state for a fresh fetch (important if refreshListKey changes in parent)
      setIssues([]);
      setEndCursor(null);
      setHasMore(true);
      setError(null);
      fetchIssues(null, true); // Fetch the first page
    } else if (status === "unauthenticated") {
      // If not authenticated, clear issues and indicate no more to load (or handle differently)
      // We can't fetch public repos with GraphQL without an access token
      // or if token is not available yet.
      setIssues([]);
      setHasMore(false);
      setIsLoading(false);
      setError("Authentication required to fetch issues via GraphQL.");
      // You might want to allow public access via REST API for non-auth users if needed.
      // For GraphQL, generally an access token is needed even for public data due to rate limiting/structure.
    }
  }, [accessToken, status, refreshListKey, fetchIssues]); // Re-run when accessToken or auth status changes

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
