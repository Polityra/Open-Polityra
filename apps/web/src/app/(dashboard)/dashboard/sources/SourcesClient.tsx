/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Search, CheckCircle2, ChevronLeft, ChevronRight, Plus, Rss } from "lucide-react";
import { api, type NewsTopic, type SourceRow } from "@open-polityra/api-client";
import {
  PageHeader,
  StatCard,
  EmptyState,
  LoadingBlock,
  ErrorNote,
  Badge,
  InfoNote,
  panel,
  sectionTitle,
  inputClass,
  chip,
  btnGhost,
  th,
  pick,
  pickTotal,
} from "@/components/dashboard/kit";

const PAGE = 20;
const TYPES = ["primary", "secondary", "tertiary"];
const NEWS_TOPICS: { id: NewsTopic; label: string }[] = [
  { id: "geopolitics", label: "Geopolitics" },
  { id: "conflict", label: "Wars & conflicts" },
  { id: "security", label: "Security" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "terrorism", label: "Terrorism" },
  { id: "sanctions", label: "Sanctions" },
];

function getNewsTopics(metadata: SourceRow["metadata"]): string {
  if (!metadata || typeof metadata.news_scraper !== "object" || metadata.news_scraper === null)
    return "—";
  const topics = (metadata.news_scraper as { topics?: unknown }).topics;
  return Array.isArray(topics)
    ? topics.filter((topic): topic is string => typeof topic === "string").join(", ") || "—"
    : "—";
}

function getNewsFeedUrl(metadata: SourceRow["metadata"]): string {
  if (!metadata || typeof metadata.news_scraper !== "object" || metadata.news_scraper === null)
    return "";
  const feedUrl = (metadata.news_scraper as { feedUrl?: unknown }).feedUrl;
  return typeof feedUrl === "string" ? feedUrl : "";
}

function getSuggestedFeedUrl(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    return url.protocol === "https:" ? `${url.origin}/rss.xml` : "";
  } catch {
    return "";
  }
}

export default function SourcesClient() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [newsTopic, setNewsTopic] = useState<NewsTopic | "">("");
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [publisher, setPublisher] = useState("");
  const [domainUrl, setDomainUrl] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [sourceCategory, setSourceCategory] = useState<"geopolitical" | "security">("geopolitical");
  const [selectedTopics, setSelectedTopics] = useState<NewsTopic[]>(["geopolitics"]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await api.sources.list({
          limit: PAGE,
          offset: (page - 1) * PAGE,
          category: category || undefined,
          topic: newsTopic || undefined,
        });
        if (cancelled) return;
        const rows = pick<SourceRow>(res, "sources");
        setSources(rows);
        setTotal(pickTotal(res, rows.length));
        setError(false);
        setCategories((prev) =>
          [
            ...new Set([...prev, ...(rows.map((r) => r.category).filter(Boolean) as string[])]),
          ].sort(),
        );
      } catch {
        if (!cancelled) {
          setSources([]);
          setTotal(0);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, category, newsTopic]);

  const visible = useMemo(
    () =>
      sources.filter(
        (s) =>
          (!type || s.data_type === type) &&
          (!search ||
            `${s.name} ${s.publisher ?? ""} ${s.category ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [sources, type, search],
  );
  const active = sources.filter((s) => s.is_active).length;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  async function addSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await api.sources.create({
        name: name.trim(),
        publisher: publisher.trim() || undefined,
        dataType: "api",
        category: sourceCategory,
        canonicalUrl: domainUrl.trim(),
        feedUrl: feedUrl.trim(),
        topics: selectedTopics,
      });
      setName("");
      setPublisher("");
      setDomainUrl("");
      setFeedUrl("");
      setPage(1);
      setCategory("");
      setFormSuccess("RSS/Atom source added. It will be checked on the next 15-minute feed sync.");
      try {
        const refreshed = await api.sources.list({ limit: PAGE, offset: 0 });
        const rows = pick<SourceRow>(refreshed, "sources");
        setSources(rows);
        setTotal(pickTotal(refreshed, rows.length));
        setCategories((prev) =>
          [...new Set([...prev, ...rows.map((row) => row.category).filter(Boolean)])].sort(),
        );
      } catch {
        setFormError(
          "The source was added, but the source list could not be refreshed. Reload the page to view it.",
        );
      }
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not add this source.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Source"
        accent="Explorer"
        description="Manage public RSS/Atom feeds used for geopolitics and security news monitoring."
      />

      <form className={`${panel} space-y-5 p-5`} onSubmit={addSource}>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
            <Rss className="h-4 w-4 text-neutral-900" />
            Add a news feed
          </div>
          <p className="mt-1 text-xs text-neutral-600">
            Only the configured HTTPS RSS/Atom feed is fetched; the scraper does not crawl or probe
            the rest of the site.
          </p>
        </div>
        {formError && <ErrorNote>{formError}</ErrorNote>}
        {formSuccess && <InfoNote>{formSuccess}</InfoNote>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-neutral-600">
            Source name
            <input
              required
              maxLength={255}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${inputClass} mt-2`}
              placeholder="Example: Public broadcaster"
            />
          </label>
          <label className="text-xs text-neutral-600">
            Publisher (optional)
            <input
              maxLength={255}
              value={publisher}
              onChange={(event) => setPublisher(event.target.value)}
              className={`${inputClass} mt-2`}
              placeholder="Organization name"
            />
          </label>
          <label className="text-xs text-neutral-600">
            Source website (HTTPS)
            <input
              required
              type="url"
              value={domainUrl}
              onChange={(event) => {
                const url = event.target.value;
                setDomainUrl(url);
                setFeedUrl(getSuggestedFeedUrl(url));
              }}
              className={`${inputClass} mt-2`}
              placeholder="https://news.example.org"
            />
          </label>
          <label className="text-xs text-neutral-600">
            RSS/Atom feed URL (HTTPS)
            <input
              required
              type="url"
              value={feedUrl}
              onChange={(event) => setFeedUrl(event.target.value)}
              className={`${inputClass} mt-2`}
              placeholder="https://news.example.org/rss.xml"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Category
          </span>
          {(["geopolitical", "security"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={sourceCategory === value}
              onClick={() => setSourceCategory(value)}
              className={chip(sourceCategory === value)}
            >
              {value === "geopolitical" ? "Geopolitics" : "Security"}
            </button>
          ))}
        </div>
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Topics (select all that apply)
          </legend>
          <div className="flex flex-wrap gap-2">
            {NEWS_TOPICS.map(({ id, label }) => {
              const checked = selectedTopics.includes(id);
              return (
                <label key={id} className={`${chip(checked)} cursor-pointer`}>
                  <input
                    className="sr-only"
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedTopics((current) =>
                        checked ? current.filter((topic) => topic !== id) : [...current, id],
                      )
                    }
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={saving || selectedTopics.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Adding feed…" : "Add source feed"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total sources" value={loading ? "—" : total} icon={Database} />
        <StatCard label="Active (this page)" value={loading ? "—" : active} icon={CheckCircle2} />
        {TYPES.slice(0, 2).map((t) => (
          <StatCard
            key={t}
            label={`${t} (this page)`}
            value={loading ? "—" : sources.filter((s) => s.data_type === t).length}
            icon={Database}
          />
        ))}
      </div>

      <div className={`${panel} space-y-4 p-5`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, publisher or category…"
            aria-label="Search sources"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Type
          </span>
          <button type="button" className={chip(!type)} onClick={() => setType("")}>
            All
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              className={`${chip(type === t)} capitalize`}
              onClick={() => setType(type === t ? "" : t)}
            >
              {t}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Category
            </span>
            <button
              type="button"
              className={chip(!category)}
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                className={`${chip(category === c)} capitalize`}
                onClick={() => {
                  setCategory(category === c ? "" : c);
                  setPage(1);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            News topic
          </span>
          <button
            type="button"
            className={chip(!newsTopic)}
            onClick={() => {
              setNewsTopic("");
              setPage(1);
            }}
          >
            All
          </button>
          {NEWS_TOPICS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={newsTopic === id}
              className={chip(newsTopic === id)}
              onClick={() => {
                setNewsTopic(newsTopic === id ? "" : id);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={panel}>
        <div className="border-b border-black/10 px-6 py-4">
          <h2 className={sectionTitle}>Source registry</h2>
        </div>
        {loading ? (
          <LoadingBlock label="Loading sources…" />
        ) : error ? (
          <div className="p-6">
            <ErrorNote>Failed to load sources from the backend.</ErrorNote>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Database}
            title="No sources found"
            text="Try different filters or search terms."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  {[
                    "Source",
                    "Feed target",
                    "Type",
                    "Publisher",
                    "Category",
                    "Topics",
                    "Status",
                  ].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.08]">
                {visible.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-black/[0.03]">
                    <td className="px-6 py-3.5 font-medium text-neutral-950">{s.name}</td>
                    <td
                      className="max-w-56 truncate px-6 py-3.5 text-xs text-neutral-600"
                      title={getNewsFeedUrl(s.metadata)}
                    >
                      {getNewsFeedUrl(s.metadata) || s.canonical_url || "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge tone={s.data_type === "primary" ? "info" : "neutral"}>
                        {s.data_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-neutral-600">{s.publisher || "—"}</td>
                    <td className="px-6 py-3.5 capitalize text-neutral-600">{s.category || "—"}</td>
                    <td className="px-6 py-3.5 text-xs text-neutral-600">
                      {getNewsTopics(s.metadata)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge tone={s.is_active ? "success" : "danger"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
            <p className="text-sm text-neutral-500">
              Showing {visible.length} of {total} sources
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={btnGhost}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs text-neutral-600">
                {page} / {pages}
              </span>
              <button
                type="button"
                className={btnGhost}
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
