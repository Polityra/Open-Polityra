const block = "animate-pulse rounded-xl border border-[#12306a] bg-[#0a1a3d]";

export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <div>
        <div className="h-8 w-64 animate-pulse rounded bg-[#0a1a3d]" />
        <div className="mt-3 h-0.5 w-16 bg-gradient-to-r from-[#32b2f7] to-[#3468f5]" />
        <div className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-[#0a1a3d]" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-32`} />
        ))}
      </div>
      <div className={`${block} h-64`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${block} h-72`} />
        <div className={`${block} h-72`} />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
