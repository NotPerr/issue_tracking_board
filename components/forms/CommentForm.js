import { useState } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";

export default function CommentForm({ show, onClose, issue, onIssueAction }) {
  const [newCommentBody, setNewCommentBody] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const { session } = useAuthStatus();

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

  const handleAddComment = async () => {
    if (!newCommentBody.trim()) {
      setActionError("Comment cannot be empty.");
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
      setNewCommentBody("");

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
      onClose();
    }
  };

  return (
    <>
      {show && (
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
                setNewCommentBody("");
                onClose();
                setActionError(null);
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
          {actionError && (
            <p className="text-red-500 text-sm mt-2">{actionError}</p>
          )}
        </div>
      )}
    </>
  );
}
