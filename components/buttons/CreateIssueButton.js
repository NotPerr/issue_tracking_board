"use client";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import IssueForm from "../forms/IssueForm";
import { useState } from "react";

export default function CreateIssueButton() {
  const { isAuthenticated, isAuthor, handleIssueAction } = useAuthStatus();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);

  const handleCreateNewIssue = () => {
    setShowForm(true);
  };

  const handleFormClose = (success, msg) => {
    setShowForm(false);
    if (msg) {
      setMessage({ type: success ? "success" : "error", text: msg });
      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <>
      {" "}
      {isAuthenticated && isAuthor && (
        <>
          <button
            onClick={handleCreateNewIssue}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 mt-4"
          >
            Create New Blog Post
          </button>
          {showForm && (
            <IssueForm
              onClose={handleFormClose}
              onIssueAction={handleIssueAction}
            />
          )}
          {message && <p>{message.text}</p>}
        </>
      )}
    </>
  );
}
