import DashboardClient from "./DashboardClient";

// Opt out of instant-navigation validation (client-fetched page)
export const instant = false;

export default function Page() {
  return <DashboardClient />;
}
