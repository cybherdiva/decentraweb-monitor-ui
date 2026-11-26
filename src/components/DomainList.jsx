function statusFor(name) {
  if (!name.expiresAt) return { label: 'Unknown', color: 'text-slate-400' }
  const now = Date.now()
  const daysLeft = (name.expiresAt - now) / (1000 * 60 * 60 * 24)
  if (name.expiryLess) return { label: 'Expiry-less', color: 'text-emerald-400' }
  if (daysLeft > 30) return { label: 'Safe', color: 'text-emerald-400' }
  if (daysLeft > 0) return { label: `${Math.ceil(daysLeft)}d left`, color: 'text-amber-400' }
  const graceDays = (name.graceEndsAt - now) / (1000 * 60 * 60 * 24)
  if (graceDays > 0) return { label: `Grace (${Math.ceil(graceDays)}d)`, color: 'text-orange-400' }
  return { label: 'Past grace', color: 'text-red-400' }
}

export default function DomainList({ names, onRefresh, connected }) {
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900 text-slate-400 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Network</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {names.map((n, i) => {
            const s = statusFor(n)
            return (
              <tr key={i} className="border-t border-slate-800 hover:bg-slate-900/50">
                <td className="px-4 py-3 font-mono">{n.name}</td>
                <td className="px-4 py-3 capitalize">{n.network}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {n.owner ? `${n.owner.slice(0, 6)}…${n.owner.slice(-4)}` : '—'}
                </td>
                <td className={`px-4 py-3 font-medium ${s.color}`}>{s.label}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onRefresh(i)}
                    disabled={!connected}
                    className="text-xs px-3 py-1 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
                  >
                    Refresh
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
