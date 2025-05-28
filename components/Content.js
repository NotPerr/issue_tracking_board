/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAuthStatus } from "@/hooks/useAuthStatus";
import IssueForm from "@/components/IssueForm";
import { useState } from "react";

export default function Content() {
  const { isLoading, isAuthenticated, isAuthor } = useAuthStatus();
  const handleCreateNewIssue = () => {
    setShowForm(true);
  };
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
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
      {isLoading && (
        <p className="text-blue-800 text-lg font-semibold mt-4">
          Checking author status...
        </p>
      )}
      {isAuthenticated && isAuthor && (
        <>
          <button
            onClick={handleCreateNewIssue}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 mt-4"
          >
            Create New Blog Post
          </button>
          {showForm && <IssueForm onClose={handleFormClose} />}
        </>
      )}
    </>
  );
}
