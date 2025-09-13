"use client";

import React from "react";
import { formatCommentDate, formatIssueDate } from "@/utils/format";
import Link from "next/link";

export default function IssueItem({ issue }) {
  // Basic validation for issue object and its properties
  if (!issue || !issue.id || !issue.title || !issue.url) {
    console.error("Invalid issue data provided to IssueItem:", issue);
    return (
      <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow-md">
        <p>Error: Invalid issue data.</p>
      </div>
    );
  }

  // Format the creation date
  const createdAtDate = formatIssueDate(issue.createdAt);

  // Function to slugify the issue title for a clean URL
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w-]+/g, "") // Remove all non-word chars
      .replace(/--+/g, "-") // Replace multiple - with single -
      .slice(0, 50); // Keep the slug concise
  };
  const issueSlug = slugify(issue.title);
  const blogPagePath = `/blogs/${issue.number}/${issueSlug}`;

  return (
    <div className="col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-center ">
      <Link href={blogPagePath} className="block cursor-pointer">
        {/* ====== issue content start ====== */}
        <div className="max-w-full">
          <h3 className="text-xl font-semibold text-blue-700 mb-2">
            {issue.title}
          </h3>
          {/* Issue Metadata */}
          <div className="text-gray-600 text-sm mb-3">
            Issue #{issue.number} | Status:{" "}
            <span
              className={`font-semibold ${
                issue.state === "OPEN" ? "text-green-600" : "text-red-600"
              }`}
            >
              {issue.state}
            </span>{" "}
            | Created: {createdAtDate}
            {issue.author && (
              <>
                {" "}
                by <p className="text-purple-600 ">{issue.author.login}</p>
              </>
            )}
          </div>

          {/* Issue Body Snippet */}
          {issue.bodyHTML && (
            <div
              className="text-gray-700 text-base line-clamp-2 mb-4 prose"
              dangerouslySetInnerHTML={{ __html: issue.bodyHTML }}
            ></div>
          )}
          {/* --- Comments Section --- */}
          {issue.comments && issue.comments.totalCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                Comments ({issue.comments.totalCount})
              </h4>
              {issue.comments.nodes.length > 0 ? (
                <div className="space-y-4">
                  {issue.comments.nodes.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-gray-50 p-1 rounded-md border border-gray-200"
                    >
                      <p className="text-sm text-gray-600 mb-1">
                        <a
                          href={
                            comment.author?.url ||
                            `https://github.com/${comment.author?.login}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {comment.author?.login || "Unknown User"}
                        </a>{" "}
                        commented on {formatCommentDate(comment.createdAt)}:
                      </p>
                      <div
                        className="prose-h1:text-xl text-gray-800 text-sm prose wrap-break-word"
                        dangerouslySetInnerHTML={{ __html: comment.bodyHTML }}
                      />
                    </div>
                  ))}
                  {issue.comments.totalCount > issue.comments.nodes.length && (
                    <p className="text-sm text-gray-500 mt-2">
                      And{" "}
                      {issue.comments.totalCount - issue.comments.nodes.length}{" "}
                      more comments...
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-500 hover:underline"
                      >
                        View all on GitHub
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No comments to display for this issue.
                </p>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
