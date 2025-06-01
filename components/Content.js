/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import IssueList from "@/components/IssueList";
import StatusLoading from "@/components/loading/StatusLoading";
import CreateIssueButton from "@/components/buttons/CreateIssueButton";

export default function Content() {
  const [refreshListKey, setRefreshListKey] = useState(0);
  const handleIssueAction = (success, msg) => {
    // If the action was successful, trigger a list refresh
    console.log("change refresh key");
    if (success) {
      console.log({ msg });
      setTimeout(() => {
        setRefreshListKey((prevKey) => prevKey + 1); // Increment key to force IssueList re-render and re-fetch
      }, 1000);
    }
  };
  return (
    <>
      <StatusLoading />
      {/* ====== create issue button ======  */}
      <CreateIssueButton />
      <IssueList
        refreshListKey={refreshListKey}
        handleIssueAction={handleIssueAction}
      />
    </>
  );
}
