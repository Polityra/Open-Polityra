import EconomyClient from "./EconomyClient";

// Opt out of instant-navigation validation (client-fetched page)
export const instant = false;

export default function Page() {
  return <EconomyClient />;
}
