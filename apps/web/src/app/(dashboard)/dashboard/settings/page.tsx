import SettingsClient from "./SettingsClient";

// Opt out of instant-navigation validation (client-fetched page)
export const instant = false;

export default function SettingsPage() {
  return <SettingsClient />;
}
