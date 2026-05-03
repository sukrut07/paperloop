import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

export function TxStatus({ hash, loading, label }: { hash?: string; loading?: boolean; label: string }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--cyan)] px-3 py-2 text-sm font-black">
        <Loader2 className="animate-spin" size={18} />
        {label}
      </div>
    );
  }

  if (!hash) return null;

  return (
    <a
      className="flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--green)] px-3 py-2 text-sm font-black"
      href={`https://amoy.polygonscan.com/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
    >
      <CheckCircle2 size={18} />
      Transaction confirmed
      <ExternalLink size={14} />
    </a>
  );
}
