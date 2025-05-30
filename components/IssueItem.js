/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import IssueForm from "./IssueForm";
import { useAuthStatus } from "@/hooks/useAuthStatus";

export default function IssueItem({ issue, onIssueAction }) {
  // onIssueAction is a callback to notify parent (IssueList) of a change
  // Ensure the issue object structure matches the GraphQL query response
  // Example GraphQL fields: id, number, title, body, createdAt, url, state, author { login, url }, labels { nodes { name, color } }
  const { session, status, isAuthor } = useAuthStatus();

  const currentUserLogin = session?.user?.login;
  // State to control the visibility of the edit form
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // For loading state of close/update buttons
  const [actionError, setActionError] = useState(null);

  // Basic validation for issue object and its properties
  if (!issue || !issue.id || !issue.title || !issue.url) {
    console.error("Invalid issue data provided to IssueItem:", issue);
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow-md">
        <p>Error: Invalid issue data.</p>
      </div>
    );
  }

  // Format the creation date
  const createdAtDate = new Date(issue.createdAt).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Helper for formatting comment dates
  const formatCommentDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- GraphQL Mutation for Closing an Issue ---
  const CLOSE_ISSUE_MUTATION = `
    mutation CloseIssue($issueId: ID!) {
      closeIssue(input: {issueId: $issueId}) {
        issue {
          id
          state
        }
      }
    }
  `;

  const handleCloseIssue = async () => {
    if (!confirm("Are you sure you want to close this blog post?")) {
      return;
    }
    if (status !== "authenticated" || !session.accessToken) {
      setActionError("Authentication required to close issues.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v4.graphql",
        },
        body: JSON.stringify({
          query: CLOSE_ISSUE_MUTATION,
          variables: {
            issueId: issue.id, // Use the global ID from GraphQL
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors?.[0]?.message || "Failed to close issue via GraphQL."
        );
      }

      // Notify parent component to refresh the list
      if (onIssueAction) {
        onIssueAction(true, "Issue closed successfully!");
      }
    } catch (err) {
      console.error("Error closing issue:", err);
      setActionError(err.message || "Failed to close issue.");
      if (onIssueAction) {
        onIssueAction(false, err.message || "Failed to close issue.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle the opening of the edit form
  const handleEditIssue = () => {
    setShowEditForm(true);
  };

  // Callback when the edit form is closed (either successfully updated or cancelled)
  const handleEditFormClose = (success, msg) => {
    setShowEditForm(false); // Close the form
    if (success && onIssueAction) {
      onIssueAction(true, msg); // Notify parent for successful update
    } else if (!success && msg && onIssueAction) {
      onIssueAction(false, msg); // Notify parent for error/cancellation
    }
    setActionError(null); // Clear local error
  };

  // --- GraphQL Mutation for Adding a Comment ---
  const ADD_COMMENT_MUTATION = `
    mutation AddComment($issueId: ID!, $body: String!) {
      addComment(input: {subjectId: $issueId, body: $body}) {
        commentEdge {
          node {
            id
            author {
              login
              url
            }
            createdAt
            bodyHTML
          }
       }
        subject {
       id
       }
     }
   }  `;

  // Function to handle adding a new comment
  const handleAddComment = async () => {
    if (!newCommentBody.trim()) {
      setActionError("Comment cannot be empty.");
      return;
    }
    if (status !== "authenticated" || !session.accessToken) {
      setActionError("Authentication required to add comments.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v4.graphql",
        },
        body: JSON.stringify({
          query: ADD_COMMENT_MUTATION,
          variables: {
            issueId: issue.id,
            body: newCommentBody,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors?.[0]?.message || "Failed to add comment via GraphQL."
        );
      }

      setNewCommentBody(""); // Clear the input field
      setShowCommentForm(false); // Hide the comment form
      // Notify parent to refresh the list, so the new comment appears
      if (onIssueAction) {
        onIssueAction(true, "Comment added successfully!");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setActionError(err.message || "Failed to add comment.");
      if (onIssueAction) {
        onIssueAction(false, err.message || "Failed to add comment.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col">
      {/* Issue Title */}
      <h3 className="text-xl font-semibold text-blue-700 mb-2">
        {issue.title}
      </h3>

      {/* Issue Metadata */}
      <p className="text-gray-600 text-sm mb-3">
        Issue #{issue.number} | Status:{" "}
        <span
          className={`font-semibold ${
            issue.state === "OPEN" ? "text-green-600" : "text-red-600"
          }`}
        >
          {issue.state}
        </span>{" "}
        | Created: {createdAtDate}
        {issue.author && (
          <>
            {" "}
            by{" "}
            <a
              href={
                issue.author.url || `https://github.com/${issue.author.login}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              {issue.author.login}
            </a>
          </>
        )}
      </p>

      {/* Labels */}
      {issue.labels && issue.labels.nodes && issue.labels.nodes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {issue.labels.nodes.map((label) => (
            <span
              key={label.name}
              className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `#${label.color}`,
                color: getContrastColor(`#${label.color}`),
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Issue Body Snippet */}
      {issue.body && (
        <p className="text-gray-700 text-base line-clamp-3 mb-4">
          {issue.body}
        </p>
      )}

      {/* --- Comments Section --- */}
      {issue.comments && issue.comments.totalCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">
            Comments ({issue.comments.totalCount})
          </h4>
          {issue.comments.nodes.length > 0 ? (
            <div className="space-y-4">
              {issue.comments.nodes.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 p-3 rounded-md border border-gray-200"
                >
                  <p className="text-sm text-gray-600 mb-1">
                    <a
                      href={
                        comment.author?.url ||
                        `https://github.com/${comment.author?.login}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {comment.author?.login || "Unknown User"}
                    </a>{" "}
                    commented on {formatCommentDate(comment.createdAt)}:
                  </p>
                  {/* DANGER: Using dangerouslySetInnerHTML. Ensure content is trusted (from GitHub API). */}
                  <div
                    className="prose-h1:text-xl text-gray-800 text-sm prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: comment.bodyHTML }}
                  />
                </div>
              ))}
              {issue.comments.totalCount > issue.comments.nodes.length && (
                <p className="text-sm text-gray-500 mt-2">
                  And {issue.comments.totalCount - issue.comments.nodes.length}{" "}
                  more comments...
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-500 hover:underline"
                  >
                    View all on GitHub
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No comments to display for this issue.
            </p>
          )}
        </div>
      )}

      {/* --- Comment Form Button (only if logged in) --- */}
      {status === "authenticated" &&
        issue.state === "OPEN" &&
        !showEditForm && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setShowCommentForm(!showCommentForm)} // Toggle comment form visibility
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 transition-colors duration-200"
            >
              {showCommentForm ? "Cancel Comment" : "Add Comment"}
            </button>
          </div>
        )}

      {/* --- Comment Input Form --- */}
      {showCommentForm &&
        status === "authenticated" &&
        issue.state === "OPEN" && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h5 className="text-lg font-semibold text-blue-800 mb-3">
              Add a Comment
            </h5>
            <textarea
              className="text-black w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows="4"
              placeholder="Write your comment here (Markdown supported)..."
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              disabled={isProcessing}
            ></textarea>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setNewCommentBody(""); // Clear input
                  setShowCommentForm(false); // Hide form
                  setActionError(null); // Clear any error
                }}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-sm hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={isProcessing || !newCommentBody.trim()}
                className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-sm hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Submitting..." : "Submit Comment"}
              </button>
            </div>
          </div>
        )}

      {/* Action Buttons (only for author) */}
      {isAuthor && !showEditForm && (
        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
          <button
            onClick={handleEditIssue}
            disabled={isProcessing}
            className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md shadow-sm hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Edit Post"}
          </button>
          {issue.state === "OPEN" && ( // Only show close button if issue is open
            <button
              onClick={handleCloseIssue}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-sm hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Closing..." : "Close issue"}
            </button>
          )}
          {issue.state === "CLOSED" && ( // Optionally show "Reopen" if issue is closed
            <button
              disabled={true} // Reopening isn't implemented here, so disable
              className="px-4 py-2 bg-gray-400 text-white font-semibold rounded-md shadow-sm cursor-not-allowed"
            >
              Post Closed
            </button>
          )}
        </div>
      )}

      {actionError && (
        <p className="text-red-500 text-sm mt-2">{actionError}</p>
      )}

      {/* Issue Edit Form (conditionally rendered) */}
      {showEditForm && (
        <IssueForm
          mode="edit" // Indicate edit mode
          initialData={{
            title: issue.title,
            body: issue.body,
            issueId: issue.id, // Pass global ID for update mutation
          }}
          onClose={handleEditFormClose} // Callback for closing the form
        />
      )}

      {/* Link to GitHub Issue - always visible */}
      {!showEditForm && ( // Hide the original link when form is open to avoid clutter
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline self-start mt-4" // Added mt-4 for spacing
        >
          Read more on GitHub &rarr;
        </a>
      )}
    </div>
  );
}

// Helper function to determine a good contrasting text color (black or white)
function getContrastColor(hexcolor) {
  // If hexcolor starts with #, remove it
  if (hexcolor.startsWith("#")) {
    hexcolor = hexcolor.slice(1);
  }
  // Convert hex to RGB
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);

  // Calculate luminance (YIQ color space)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black for light colors, white for dark colors
  return yiq >= 128 ? "black" : "white";
}
