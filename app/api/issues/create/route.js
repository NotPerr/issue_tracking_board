/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

const REPO_OWNER_GITHUB_ID_SERVER =
  process.env.NEXT_PUBLIC_REPO_OWNER_GITHUB_ID;
const REPO_OWNER_USERNAME_FOR_API = process.env.GITHUB_REPO_OWNER;
const REPO_NAME = process.env.GITHUB_REPO_NAME;

export async function POST(request) {
  const session = await getServerSession(authOptions);
  // 1. Authentication Check
  if (!session || !session.accessToken) {
    return NextResponse.json(
      { message: "Unauthorized: No active session or access token." },
      { status: 401 }
    );
  }
  // 2. Authorization Check (Is the logged-in user the repo owner?)
  if (!session.githubId || session.githubId !== REPO_OWNER_GITHUB_ID_SERVER) {
    return NextResponse.json(
      { message: "Forbidden: Only the repository owner can create issues." },
      { status: 403 }
    );
  }
  const { title, body } = await request.json();
  // 3. Input Validation (Server-side)
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      { message: "Title is required." },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "string" || body.trim().length < 30) {
    return NextResponse.json(
      { message: "Body must be at least 30 characters." },
      { status: 400 }
    );
  }
  try {
    // 4. Make POST request to GitHub Issues API
    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER_USERNAME_FOR_API}/${REPO_NAME}/issues`;
    const createIssueResponse = await fetch(githubApiUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${session.accessToken}`, // Use the user's access token
        Accept: "application/vnd.github.v3+json", // Request GitHub API v3 JSON format
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body }),
    });

    const responseData = await createIssueResponse.json();

    // 5. Handle GitHub API Response
    if (!createIssueResponse.ok) {
      console.error("GitHub API error:", responseData);
      // Return GitHub's error message if available, otherwise a generic one
      return NextResponse.json(
        {
          message: responseData.message || "Failed to create issue on GitHub.",
        },
        { status: createIssueResponse.status }
      );
    }

    // Success
    return NextResponse.json(responseData, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Server error creating issue:", error);
    return NextResponse.json(
      { message: "Internal server error occurred while creating issue." },
      { status: 500 }
    );
  }
}
