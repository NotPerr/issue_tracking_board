"use client";
import { SessionProvider } from "next-auth/react";
import AuthStatus from "@/components/AuthStatus";
import Content from "@/components/Content";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <SessionProvider>
        {" "}
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <AuthStatus />
          <Content />
        </main>
      </SessionProvider>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
