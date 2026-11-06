'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ExternalLink, Newspaper, RefreshCw, Search } from 'lucide-react'
import { api, type NewsItem, type NewsTopic } from '@open-polityra/api-client'
import { Badge, EmptyState, ErrorNote, LoadingBlock, PageHeader, panel, chip, inputClass } from '@/components/dashboard/kit'

const TOPICS: { id: NewsTopic; label: string }[] = [
  { id: 'geopolitics', label: 'Geopolitics' },
  { id: 'conflict', label: 'Wars & conflicts' },
  { id: 'security', label: 'Security' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'terrorism', label: 'Terrorism' },
  { id: 'sanctions', label: 'Sanctions' },
]

export default function NewsClient() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [category, setCategory] = useState<'geopolitical' | 'security' | ''>('')
  const [topic, setTopic] = useState<NewsTopic | ''>('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncNote, setSyncNote] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const loadItems = useCallback(async () => {
    try {
      const result = await api.news.list({
        limit: 50,
        category: category || undefined,
        topic: topic || undefined,
        search: query || undefined,
      })
      setItems(result.items)
      setTotal(result.meta.total)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load news items.')
    } finally {
      setLoading(false)
    }
  }, [category, query, topic])

  useEffect(() => {
    let cancelled = false
    void api.news.list({
      limit: 50,
      category: category || undefined,
      topic: topic || undefined,
      search: query || undefined,
    }).then((result) => {
      if (cancelled) return
      setItems(result.items)
      setTotal(result.meta.total)
      setError(null)
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load news items.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [category, query, topic])

  async function syncNow() {
    setSyncing(true)
    setError(null)
    setSyncNote(null)
    try {
      const result = await api.news.sync()
      await loadItems()
      if (result.failures.length > 0) {
        setSyncNote(`Parsed ${result.itemsParsed} feed entries; added ${result.inserted} new items from ${result.sources} feeds. ${result.failures.length} feed(s) failed; check the API logs for source errors.`)
      } else {
        setSyncNote(`Parsed ${result.itemsParsed} feed entries; added ${result.inserted} new items from ${result.sources} configured feed(s).`)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sync news feeds.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="World"
        accent="News Monitor"
        description="Public reporting from the RSS/Atom feeds configured in Sources. Summaries are publisher-provided and are not independently verified."
        action={<button type="button" disabled={syncing} onClick={() => void syncNow()} className="inline-flex items-center gap-2 rounded-lg bg-[#1478fd] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />{syncing ? 'Checking feeds…' : 'Sync feeds now'}</button>}
      />

      <div className={`${panel} space-y-4 p-5`}>
        <form className="relative" onSubmit={(event) => { event.preventDefault(); setQuery(search.trim()) }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#74829f]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search headlines and summaries…" aria-label="Search news" className={`${inputClass} pl-9`} />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 font-mono text-[11px] uppercase tracking-wider text-[#74829f]">Category</span>
          <button type="button" aria-pressed={!category} className={chip(!category)} onClick={() => setCategory('')}>All</button>
          <button type="button" aria-pressed={category === 'geopolitical'} className={chip(category === 'geopolitical')} onClick={() => setCategory(category === 'geopolitical' ? '' : 'geopolitical')}>Geopolitics</button>
          <button type="button" aria-pressed={category === 'security'} className={chip(category === 'security')} onClick={() => setCategory(category === 'security' ? '' : 'security')}>Security</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 font-mono text-[11px] uppercase tracking-wider text-[#74829f]">Topic</span>
          <button type="button" aria-pressed={!topic} className={chip(!topic)} onClick={() => setTopic('')}>All</button>
          {TOPICS.map(({ id, label }) => <button key={id} type="button" aria-pressed={topic === id} className={chip(topic === id)} onClick={() => setTopic(topic === id ? '' : id)}>{label}</button>)}
        </div>
      </div>

      {syncNote && <p role="status" className="text-sm text-[#9aa8c7]">{syncNote}</p>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {error ? null : loading ? <LoadingBlock label="Loading public news…" /> : (
        items.length === 0
          ? <EmptyState icon={Newspaper} title="No feed items found" text="Add HTTPS RSS/Atom feeds in Sources, then sync them. Configured feeds are checked every 15 minutes, including by Vercel Cron in production." />
          : <div className="space-y-3">
            <p className="text-xs text-[#74829f]">Showing {items.length} of {total} stored items · retained for up to 90 days</p>
            {items.map((item) => (
              <article key={item.id} className={`${panel} space-y-3 p-5`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={item.category === 'security' ? 'warning' : 'info'}>{item.category}</Badge>
                  {item.topics.map((tag) => <span key={tag} className="rounded-full border border-[#12306a] px-2.5 py-0.5 text-xs capitalize text-[#9aa8c7]">{tag}</span>)}
                  <span className="ml-auto text-xs text-[#74829f]">{item.published_at ? new Date(item.published_at).toLocaleString() : 'Publication date unavailable'}</span>
                </div>
                <h2 className="text-base font-semibold leading-6 text-[#eef2fc]">{item.title}</h2>
                {item.summary && <p className="text-sm leading-6 text-[#9aa8c7]">{item.summary}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#12306a] pt-3">
                  <span className="text-xs text-[#74829f]">{item.publisher || item.source_name}</span>
                  <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline">Read at source<ExternalLink className="h-3 w-3" /></a>
                </div>
              </article>
            ))}
          </div>
      )}
      <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs leading-5 text-amber-100/80">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        News content and summaries are supplied by source publishers. This monitor does not verify claims, assess threats, or provide operational instructions.
      </div>
    </div>
  )
}
