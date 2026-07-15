import { format } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';

const AuditLogTable = ({ logs }) => {
  if (logs.length === 0) {
    return <div className="card p-10 text-center text-ink-500">No audit events found</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Target</th>
              <th className="px-5 py-3">IP</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-ink-50/50 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-ink-800">{log.action}</td>
                <td className="px-5 py-3.5 text-ink-600">{log.actorEmail || 'System'}</td>
                <td className="px-5 py-3.5 text-ink-500">{log.targetType ? `${log.targetType} · ${String(log.targetId ?? '').slice(-6)}` : '—'}</td>
                <td className="px-5 py-3.5 text-ink-500">{log.ip || '—'}</td>
                <td className="px-5 py-3.5">
                  {log.status === 'success' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 size={13} /> Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                      <XCircle size={13} /> Failure
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-ink-500">{format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;
