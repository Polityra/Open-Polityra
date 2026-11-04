import ForecastingClient from "./ForecastingClient";

// Opt out of instant-navigation validation (client-fetched page)
export const instant = false;

export default function Page() {
  return <ForecastingClient />;
}
