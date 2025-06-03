// types/github.d.ts (or types/github.ts)

// Interfaces for GitHub GraphQL Issue data
export interface GitHubAuthor {
  login: string;
  url: string;
  avatarUrl: string;
}

export interface GitHubLabel {
  name: string;
  color: string;
}

export interface GitHubComment {
  id: string;
  author: GitHubAuthor | null;
  bodyHTML: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueNode {
  id: string;
  number: number;
  title: string;
  bodyHTML: string;
  createdAt: string;
  url: string;
  state: "OPEN" | "CLOSED";
  author: GitHubAuthor | null;
  labels: {
    nodes: GitHubLabel[];
  };
  comments: {
    totalCount: number;
  };
  reactions: {
    totalCount: number;
  };
}

export interface IssuePageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
}

export interface IssueDataResponse {
  nodes: IssueNode[];
  pageInfo: IssuePageInfo;
  error?: string; // Optional error property for server-side fetching
}
