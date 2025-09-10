import { NextResponse } from "next/server";

const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;
const ISSUES_PER_FETCH = 10;

const ISSUE_LIST_QUERY = `
  query GetRepoIssues($owner: String!, $repo: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $repo) {
      issues(first: $first, after: $after, states: [OPEN], orderBy: {field: CREATED_AT, direction: DESC}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
          body,
          bodyHTML,
          createdAt
          url
          state
          author {
            login
            url
        }
          labels(first: 5) {
            nodes {
              name
              color
            }
          }
         
        }
      }
    }
  }
`;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");

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
        query: ISSUE_LIST_QUERY,
        variables: {
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          first: ISSUES_PER_FETCH,
          after: after || null,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      console.error(
        "GitHub API Error in /api/public-issues:",
        result.errors || response.statusText
      );
      return NextResponse.json(
        {
          error:
            result.errors?.[0]?.message ||
            "Failed to fetch issues from GitHub.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result.data.repository.issues);
  } catch (error) {
    console.error("Server error fetching issues:", error);
    return NextResponse.json(
      { error: "Internal server error fetching blog posts." },
      { status: 500 }
    );
  }
}
