import { useAuthStatus } from "@/hooks/useAuthStatus";

export default function Content() {
  const { isLoading, isAuthenticated, isAuthor } = useAuthStatus();
  const handleCreateNewIssue = () => {
    alert("Owner wants to create a new issue! (This would open a form/modal)");
  };

  return (
    <>
      {isLoading && (
        <p className="text-blue-800 text-lg font-semibold mt-4">
          Checking author status...
        </p>
      )}
      {isAuthenticated && isAuthor && (
        <button
          onClick={handleCreateNewIssue}
          className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 mt-4"
        >
          Create New Blog Post
        </button>
      )}
    </>
  );
}
