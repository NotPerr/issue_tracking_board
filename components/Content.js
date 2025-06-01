/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAuthStatus } from "@/hooks/useAuthStatus";
import IssueForm from "@/components/IssueForm";
import { useState } from "react";
import IssueList from "@/components/IssueList";

export default function Content() {
  const { isLoading, isAuthenticated, isAuthor } = useAuthStatus();
  const handleCreateNewIssue = () => {
    setShowForm(true);
  };
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [refreshListKey, setRefreshListKey] = useState(0);

  const handleFormClose = (success, msg) => {
    setShowForm(false);
    if (msg) {
      setMessage({ type: success ? "success" : "error", text: msg });
      // Clear message after a few seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleIssueAction = (success, msg) => {
    // Hide the form if it was active
    setShowForm(false);
    // Display message
    if (msg) {
      setMessage({ type: success ? "success" : "error", text: msg });
      setTimeout(() => setMessage(null), 5000);
    }
    // If the action was successful, trigger a list refresh
    if (success) {
      console.log("modify refresh key");
      setTimeout(() => {
        setRefreshListKey((prevKey) => prevKey + 1); // Increment key to force IssueList re-render and re-fetch
      }, 2000);
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
          {showForm && (
            <IssueForm
              onClose={handleFormClose}
              onIssueAction={handleIssueAction}
            />
          )}
        </>
      )}
      <IssueList
        refreshListKey={refreshListKey}
        onIssueAction={handleIssueAction}
      />
    </>
  );
}
