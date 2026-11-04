import DomainView from "@/components/dashboard/DomainView";

// Opt out of instant-navigation validation (client-fetched page)
export const instant = false;

export default function Page() {
  return <DomainView domain="security" />;
}
