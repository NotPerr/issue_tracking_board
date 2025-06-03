import AuthStatus from "@/components/AuthStatus";
import Content from "@/components/Content";
import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import { getIssues } from "@/lib/github";
import { IssueDataResponse } from "@/types/github";

export default async function Home() {
  // --- Server-side fetching for initial issues ---
  const initialIssuesData: IssueDataResponse = await getIssues();
  const initialError = initialIssuesData.error || null;
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {" "}
      <NextAuthSessionProvider>
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <AuthStatus />
          <Content
            initialIssues={initialIssuesData.nodes || []}
            initialEndCursor={initialIssuesData.pageInfo?.endCursor || null}
            initialHasNextPage={
              initialIssuesData.pageInfo?.hasNextPage || false
            }
            initialError={initialError}
          />
        </main>
      </NextAuthSessionProvider>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
