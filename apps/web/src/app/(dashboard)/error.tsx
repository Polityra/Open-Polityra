"use client";

import { useEffect } from "react";
import Link from "next/link";
import StatusPage, { btnGhost, btnPrimary } from "@/components/common/StatusPage";

export default function DashboardError({
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
      fullScreen={false}
      eyebrow="Dashboard error"
      title="This view couldn't be loaded"
      description="Something went wrong while loading this section. The rest of the dashboard is still available."
      detail={error.digest}
    >
      <button type="button" onClick={() => reset()} className={btnPrimary}>
        Try again
      </button>
      <Link href="/dashboard" className={btnGhost}>
        Back to dashboard
      </Link>
    </StatusPage>
  );
}
