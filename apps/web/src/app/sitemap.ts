import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/research", changeFrequency: "monthly", priority: 0.9 },
    { path: "/methodology", changeFrequency: "monthly", priority: 0.7 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  ] as const;

  return pages.map(({ path, ...entry }) => ({
    url: new URL(path, SITE_URL).toString(),
    ...entry,
  }));
}
