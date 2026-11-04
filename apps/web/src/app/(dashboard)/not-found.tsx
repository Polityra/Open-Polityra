import Link from "next/link";
import StatusPage, { btnGhost, btnPrimary } from "@/components/common/StatusPage";

// Shown when a dashboard page calls notFound() (e.g. a missing report or source).
export default function DashboardNotFound() {
  return (
    <StatusPage
      fullScreen={false}
      code="404"
      eyebrow="Not found"
      title="We couldn't find that record"
      description="It may have been removed, or you may not have access to it."
    >
      <Link href="/dashboard" className={btnPrimary}>Back to dashboard</Link>
      <Link href="/dashboard/reports" className={btnGhost}>Browse reports</Link>
    </StatusPage>
  );
}
