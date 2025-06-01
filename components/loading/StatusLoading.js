"use client";
import { useAuthStatus } from "@/hooks/useAuthStatus";

export default function StatusLoading() {
  const { isLoading } = useAuthStatus();
  return (
    <>
      {isLoading && (
        <p className="text-blue-800 text-lg font-semibold mt-4">
          Checking author status...
        </p>
      )}
    </>
  );
}
