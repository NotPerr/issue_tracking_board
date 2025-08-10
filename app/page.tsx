import Content from "@/components/Content";
import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";
import { getIssues } from "@/lib/github";
import { IssueDataResponse } from "@/types/github";
import { Toaster } from "react-hot-toast";
import NavBar from "@/components/NavBar";

export default async function Home() {
  // --- Server-side fetching for initial issues ---
  const initialIssuesData: IssueDataResponse = await getIssues();
  const initialError = initialIssuesData.error || null;
  return (
    <div className="grid  items-center justify-items-center min-h-screen pb-20 gap-16 font-[family-name:var(--font-geist-sans)]">
      {" "}
      <NextAuthSessionProvider>
        <main className="flex flex-col  items-center sm:items-start w-screen">
          <NavBar />
          <Toaster position="top-right" reverseOrder={false} />
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
