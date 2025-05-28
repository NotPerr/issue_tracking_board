"use client";

import { useState } from "react";

export default function IssueForm({ onClose }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
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

    setIsLoading(true);

    try {
      const response = await fetch("/api/issues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create issue.");
      }

      onClose(true, "Issue created successfully!"); // Close and indicate success
    } catch (err) {
      console.error("Error creating issue:", err);
      setError(err.message || "An unexpected error occurred.");
      onClose(false, err.message || "Failed to create issue."); // Close and indicate error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full relative">
        <h2 className="text-2xl font-bold mb-6 text-purple-700">
          Create New Blog Post
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-black mb-1"
            >
              Title:
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 text-black rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label
              htmlFor="body"
              className="block text-sm text-black font-medium  mb-1"
            >
              Body:
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows="8"
              className="w-full p-3 border border-gray-300 text-black rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            ></textarea>
          </div>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => onClose(false, null)} // Close without message on cancel
              className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-400 transition duration-300 ease-in-out"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
