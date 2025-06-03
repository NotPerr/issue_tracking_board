"use client";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import IssueForm from "../forms/IssueForm";
import { useState } from "react";

// Define props interface for CreateIssueButton
interface CreateIssueButtonProps {
  handleIssueAction: (success: boolean, msg: string) => void; // Now receives this as a prop
}

export default function CreateIssueButton({
  handleIssueAction,
}: CreateIssueButtonProps) {
  const { isAuthenticated, isAuthor } = useAuthStatus();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null
  );

  const handleCreateNewIssue = () => {
    setShowForm(true);
  };

  const handleFormClose = (success: boolean, msg: string) => {
    setShowForm(false);
    if (msg) {
      setMessage({ type: success ? "success" : "error", text: msg });
      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 5000);
    }
    handleIssueAction(success, msg);
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
