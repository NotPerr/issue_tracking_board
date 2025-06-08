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

  const handleCreateNewIssue = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  return (
    <>
      {" "}
      {isAuthenticated && isAuthor && (
        <>
          <button
            onClick={handleCreateNewIssue}
            className="mx-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 mt-4"
          >
            Create New Blog Post
          </button>
          {showForm && (
            <IssueForm
              onClose={handleFormClose}
              onIssueAction={handleIssueAction}
            />
          )}
        </>
      )}
    </>
  );
}
