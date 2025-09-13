import { NextResponse } from "next/server";

const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;

// GraphQL query to fetch a single issue by its number
const SINGLE_ISSUE_QUERY = `
  query GetSingleIssue($owner: String!, $repo: String!, $issueNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $issueNumber) {
        id
        number
        title
        bodyHTML,
        body,
        createdAt
        url
        state
        author {
          login
          url
        }
        
        comments(first: 20, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            id
            author {
              login
              url
            }
            bodyHTML
            createdAt
          }
          totalCount
        }
      }
    }
  }
`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const issueNumber = searchParams.get("issue_number");

  // Ensure the issue number is provided and is a valid integer
  if (!issueNumber || isNaN(parseInt(issueNumber, 10))) {
    return NextResponse.json(
      { error: "Invalid or missing issue number." },
      { status: 400 }
    );
  }

  const githubToken = process.env.GITHUB_PERSONAL_TOKEN;

  if (!githubToken) {
    return NextResponse.json(
      { error: "Server-side GitHub token not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v4.graphql",
      },
      body: JSON.stringify({
        query: SINGLE_ISSUE_QUERY,
        variables: {
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          issueNumber: parseInt(issueNumber, 10),
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      console.error(
        "GitHub API Error in /api/single-issue:",
        result.errors || response.statusText
      );
      return NextResponse.json(
        {
          error:
            result.errors?.[0]?.message || "Failed to fetch issue from GitHub.",
        },
        { status: response.status }
      );
    }

    const issue = result.data.repository.issue;
    if (!issue) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Server error fetching single issue:", error);
    return NextResponse.json(
      { error: "Internal server error fetching blog post." },
      { status: 500 }
    );
  }
}
