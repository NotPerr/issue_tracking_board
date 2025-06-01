"use client";

import { useState } from "react";
import CommentForm from "../forms/CommentForm";

export default function CommentFormButton({ issue, onIssueAction }) {
  const [showCommentForm, setShowCommentForm] = useState(false);

  function onCommentFormClose() {
    setShowCommentForm(false);
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={() => setShowCommentForm(!showCommentForm)} // Toggle comment form visibility
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 transition-colors duration-200"
        >
          {showCommentForm ? "Cancel Comment" : "Add Comment"}
        </button>
      </div>

      <CommentForm
        show={showCommentForm}
        onClose={onCommentFormClose}
        issue={issue}
        onIssueAction={onIssueAction}
      />
    </>
  );
}
