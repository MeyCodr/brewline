function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(90deg, var(--canvas-2) 25%, #f0ece4 50%, var(--canvas-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        borderRadius: 12,
        ...style,
      }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* Topbar skeleton */}
      <div className="flex items-center justify-between px-8 py-[18px] border-b" style={{ borderColor: 'var(--border)', background: 'var(--canvas)' }}>
        <div className="flex flex-col gap-2">
          <Skeleton style={{ width: 140, height: 12 }} />
          <Skeleton style={{ width: 220, height: 28 }} />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton style={{ width: 300, height: 38, borderRadius: 10 }} />
          <Skeleton style={{ width: 38, height: 38, borderRadius: 10 }} />
          <Skeleton style={{ width: 70, height: 38, borderRadius: 999 }} />
          <Skeleton style={{ width: 38, height: 38, borderRadius: '50%' }} />
        </div>
      </div>

      <div className="p-8 flex flex-col gap-5 max-w-[1400px] mx-auto w-full">
        {/* Hero */}
        <Skeleton style={{ height: 240, borderRadius: 22 }} />

        {/* Stat grid */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[18px] border p-5" style={{ background: '#fff', borderColor: 'var(--border)' }}>
              <div className="flex justify-between mb-5">
                <Skeleton style={{ width: 38, height: 38, borderRadius: 10 }} />
                <Skeleton style={{ width: 50, height: 22, borderRadius: 6 }} />
              </div>
              <Skeleton style={{ width: 100, height: 36, marginBottom: 8 }} />
              <Skeleton style={{ width: 140, height: 14 }} />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--border)' }}>
            <div className="flex justify-between mb-4">
              <div className="flex flex-col gap-1.5"><Skeleton style={{ width: 80, height: 18 }} /><Skeleton style={{ width: 160, height: 13 }} /></div>
              <Skeleton style={{ width: 120, height: 32, borderRadius: 10 }} />
            </div>
            <Skeleton style={{ height: 200, borderRadius: 8 }} />
          </div>
          <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--border)' }}>
            <div className="flex justify-between mb-4">
              <div className="flex flex-col gap-1.5"><Skeleton style={{ width: 120, height: 18 }} /><Skeleton style={{ width: 140, height: 13 }} /></div>
              <Skeleton style={{ width: 70, height: 24, borderRadius: 999 }} />
            </div>
            <Skeleton style={{ height: 200, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </>
  );
}
