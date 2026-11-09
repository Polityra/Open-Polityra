import Link from "next/link";
import StatusPage, { btnGhost, btnPrimary } from "@/components/common/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      eyebrow="Page not found"
      title="This page drifted out of orbit"
      description="The page you are looking for doesn't exist, was moved, or the link is incorrect."
    >
      <Link href="/" className={btnPrimary}>
        Back to home
      </Link>
      <Link href="/dashboard" className={btnGhost}>
        Open dashboard
      </Link>
    </StatusPage>
  );
}
