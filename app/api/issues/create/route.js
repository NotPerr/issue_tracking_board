/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const REPO_OWNER_GITHUB_ID_SERVER =
  process.env.NEXT_PUBLIC_REPO_OWNER_GITHUB_ID;
const REPO_OWNER_USERNAME_FOR_API = "NotPerr";
const REPO_NAME = "";

export async function POST(request) {}
