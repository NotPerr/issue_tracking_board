/* eslint-disable @typescript-eslint/no-unused-vars */
import BlogPostClient from "@/components/BlogPostClient";
import NextAuthSessionProvider from "@/providers/NextAuthSessionProvider";

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const issueNumber = slug[0];
  return (
    <NextAuthSessionProvider>
      <BlogPostClient issueNumber={issueNumber} />
    </NextAuthSessionProvider>
  );
}
