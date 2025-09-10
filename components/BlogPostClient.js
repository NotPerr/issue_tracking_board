"use client";
import CommentFormButton from "./buttons/CommentFormButton";
import IssueForm from "./forms/IssueForm";
import { formatCommentDate, formatIssueDate } from "@/utils/format";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function BlogPostClient({ issueNumber }) {
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { session, status, isAuthor } = useAuthStatus();
  const [actionError, setActionError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const fetchIssue = async () => {
    setIsLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/single-issue?issue_number=${issueNumber}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Failed to fetch singel issue from local API."
        );
      }
      setIssue(data);
    } catch (error) {
      console.error("Client-side error fetching single issue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (issueNumber) {
      fetchIssue();
    }
  }, [issueNumber]);

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

      handleIssueAction(true, "Issue closed successfully!");
    } catch (err) {
      console.error("Error closing issue:", err);
      setActionError(err.message || "Failed to close issue.");
      handleIssueAction(false, err.message || "Failed to close issue.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Callback when the edit form is closed (either successfully updated or cancelled)
  const handleEditFormClose = (success, msg) => {
    setShowEditForm(false); // Close the form
    if (success) {
      handleIssueAction(true, msg); // Notify parent for successful update
    } else if (!success && msg) {
      handleIssueAction(false, msg); // Notify parent for error/cancellation
    }
    setActionError(null); // Clear local error
  };

  const handleEditIssue = () => {
    setShowEditForm(true);
  };

  const handleIssueAction = (success, msg) => {
    if (success) {
      toast.success(msg);
      fetchIssue(); // This will re-fetch the data to refresh the page
    } else if (msg) {
      toast.error(msg);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="text-center text-gray-500">Loading blog post...</div>
      ) : (
        <div className="max-w-full p-2">
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
            | Created: {formatIssueDate(issue.createdAt)}
            {issue.author && (
              <>
                {" "}
                by{" "}
                <a
                  href={
                    issue.author.url ||
                    `https://github.com/${issue.author.login}`
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
          {issue.labels &&
            issue.labels.nodes &&
            issue.labels.nodes.length > 0 && (
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
          {/* Issue Body */}
          {issue.bodyHTML && (
            <div
              className="text-gray-700 text-base mb-4 prose"
              dangerouslySetInnerHTML={{ __html: issue.bodyHTML }}
            />
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
                      className="bg-gray-50 p-1 rounded-md border border-gray-200"
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
                        className="prose-h1:text-xl text-gray-800 text-sm prose wrap-break-word"
                        dangerouslySetInnerHTML={{ __html: comment.bodyHTML }}
                      />
                    </div>
                  ))}
                  {issue.comments.totalCount > issue.comments.nodes.length && (
                    <p className="text-sm text-gray-500 mt-2">
                      And{" "}
                      {issue.comments.totalCount - issue.comments.nodes.length}{" "}
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
          {status === "authenticated" && (
            <CommentFormButton
              handleIssueAction={handleIssueAction}
              issue={issue}
            />
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
              onClose={handleEditFormClose}
              onIssueAction={handleIssueAction}
            />
          )}

          {/* Link to GitHub Issue - only if login user is owner */}
          {!showEditForm && isAuthor && (
            // Hide the original link when form is open to avoid clutter
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
      )}
    </>
  );
}
