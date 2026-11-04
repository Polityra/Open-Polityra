"use client";

import { useEffect } from "react";
import Link from "next/link";
import StatusPage, { btnGhost, btnPrimary } from "@/components/common/StatusPage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      eyebrow="Something went wrong"
      title="We hit an unexpected error"
      description="An error occurred while loading this page. You can try again, or return to the home page."
      detail={error.digest}
    >
      <button type="button" onClick={() => reset()} className={btnPrimary}>
        Try again
      </button>
      <Link href="/" className={btnGhost}>Back to home</Link>
    </StatusPage>
  );
}
