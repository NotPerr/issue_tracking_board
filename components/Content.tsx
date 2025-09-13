"use client";
import { useState } from "react";
import IssueList from "@/components/IssueList";
import CreateIssueButton from "@/components/buttons/CreateIssueButton";
import { IssueNode } from "@/types/github";
import toast from "react-hot-toast";

// Define ContentProps interface and use it for the component's props
interface ContentProps {
  initialIssues: IssueNode[];
  initialEndCursor: string | null;
  initialHasNextPage: boolean;
  initialError: string | null;
}

export default function Content({
  initialIssues,
  initialEndCursor,
  initialHasNextPage,
  initialError,
}: ContentProps) {
  const [refreshListKey, setRefreshListKey] = useState(0);
  const handleIssueAction = (success: boolean, msg: string) => {
    // If the action was successful, trigger a list refresh and show notification
    if (success) {
      console.log({ msg });
      toast.success(msg);
      setTimeout(() => {
        setRefreshListKey((prevKey) => prevKey + 1);
      }, 1000);
    }
  };
  return (
    <>
      <CreateIssueButton handleIssueAction={handleIssueAction} />

      {initialError ? (
        <div className="flex flex-col items-center justify-center p-4 text-red-600">
          <p className="text-lg">Error loading initial posts: {initialError}</p>
          <p className="text-sm text-gray-500 mt-2">
            Please ensure the repository is public and server config is correct.
          </p>
        </div>
      ) : (
        <IssueList
          initialIssues={initialIssues}
          initialEndCursor={initialEndCursor}
          initialHasNextPage={initialHasNextPage}
          refreshListKey={refreshListKey} // This triggers IssueList to re-fetch
        />
      )}
    </>
  );
}
