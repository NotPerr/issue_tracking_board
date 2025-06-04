/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useAuthStatus } from "@/hooks/useAuthStatus";

// Define the type for initialData if in edit mode
interface InitialIssueData {
  issueId: string; // GitHub's global ID for the issue
  title: string;
  body: string;
  // Add any other properties you might need from initialData for editing
}

// Define the props interface for IssueForm
interface IssueFormProps {
  onClose: () => void;
  mode?: "create" | "edit"; // Optional: 'create' or 'edit' mode, defaults to 'create'
  initialData?: InitialIssueData; // Optional: Data to pre-fill form in edit mode
  onIssueAction: (success: boolean, msg: string) => void; // Callback for when an issue action (create/update) completes
}

export default function IssueForm({
  onClose,
  mode = "create", // Default value for mode
  initialData,
  onIssueAction,
}: IssueFormProps) {
  const { session } = useAuthStatus();
  const accessToken = session?.accessToken;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GITHUB_REPO_OWNER = "NotPerr";
  const GITHUB_REPO_NAME = "issue_tracking_board";

  // Populate form fields if in edit mode and initialData is provided
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title || "");
      setBody(initialData.body || "");
    } else {
      // Clear form for create mode
      setTitle("");
      setBody("");
    }
  }, [mode, initialData]);

  // GraphQL Mutations
  const CREATE_ISSUE_MUTATION = `
    mutation CreateIssue($repoId: ID!, $title: String!, $body: String) {
      createIssue(input: {repositoryId: $repoId, title: $title, body: $body}) {
        issue {
          id
          number
          title
          body
          createdAt
          url
          state
          author {
            login
          }
        }
      }
    }
  `;

  const UPDATE_ISSUE_MUTATION = `
    mutation UpdateIssue($id: ID!, $title: String, $body: String) {
      updateIssue(input: {id: $id, title: $title, body: $body}) {
        issue {
          id
          title
          body
          # Add other fields you want to get back after update if necessary
        }
      }
    }
  `;

  // Query to get repository ID (needed for createIssue mutation)
  const REPO_ID_QUERY = `
    query GetRepositoryId($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        id
      }
    }
  `;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Client-side validation
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (body.trim().length < 30) {
      setError("Body must be at least 30 characters.");
      return;
    }
    if (!accessToken) {
      setError("Authentication required.");
      return;
    }

    setIsLoading(true);

    try {
      let mutationQuery;
      let variables = {};
      let successMessage;

      if (mode === "create") {
        mutationQuery = CREATE_ISSUE_MUTATION;
        successMessage = "Blog post created successfully!";

        // Fetch repository ID first for create mutation
        const repoIdResponse = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v4.graphql",
          },
          body: JSON.stringify({
            query: REPO_ID_QUERY,
            variables: { owner: GITHUB_REPO_OWNER, repo: GITHUB_REPO_NAME },
          }),
        });

        const repoIdResult = await repoIdResponse.json();
        if (!repoIdResponse.ok || repoIdResult.errors) {
          onIssueAction(false, "Blog creation failed!");
          throw new Error(
            repoIdResult.errors?.[0]?.message || "Failed to get repository ID."
          );
        }
        const repoId = repoIdResult.data.repository.id;
        variables = { repoId, title, body };
        onIssueAction(true, successMessage);
      } else {
        // mode === "edit"
        mutationQuery = UPDATE_ISSUE_MUTATION;
        successMessage = "Blog post updated successfully!";
        // The initialData will contain the issueId (global ID)
        if (!initialData?.issueId) {
          throw new Error("Issue ID is missing for update operation.");
        }
        variables = { id: initialData.issueId, title, body };
        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v4.graphql",
          },
          body: JSON.stringify({
            query: mutationQuery,
            variables,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.errors) {
          console.error("GraphQL Errors:", result.errors);
          throw new Error(
            result.errors?.[0]?.message ||
              `Failed to ${mode} issue via GraphQL.`
          );
        }
        onIssueAction(true, successMessage);
      }
      onClose();
    } catch (err: any) {
      console.error(`Error ${mode}ing issue:`, err);
      setError(err.message || `Failed to ${mode} issue.`);
      onIssueAction(false, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {mode === "create" ? "Create New Blog Post" : "Edit Blog Post"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Title:
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="body"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Content:
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
              disabled={isLoading}
            ></textarea>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose()}
              className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : mode === "create"
                ? "Create Post"
                : "Update Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
