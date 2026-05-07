type Log = { id: string; action: string; result: string; createdAt: string };

export default function InteractionLogList({ logs }: { logs: Log[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-black">最近互动</h3>
      {logs.length === 0 && <p className="text-sm text-ink/60">还没有互动记录。</p>}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
        {logs.map((log) => {
          let summary = log.action;
          try {
            const result = JSON.parse(log.result);
            summary = result.title ? `${result.title}：${result.story}` : `${log.action} +${result.expGain ?? 0} exp`;
          } catch {}
          return (
            <div key={log.id} className="rounded-lg bg-white px-3 py-2 text-sm">
              <div className="font-semibold">{summary}</div>
              <div className="text-xs text-ink/50">{new Date(log.createdAt).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
