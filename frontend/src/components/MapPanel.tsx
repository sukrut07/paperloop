import { MapPinned, Navigation } from 'lucide-react';

export function MapPanel({
  address = 'Mumbai, Maharashtra',
  searchQuery,
  title = 'Nearby pickups',
  heightClassName = 'h-[420px]',
}: {
  address?: string;
  searchQuery?: string;
  title?: string;
  heightClassName?: string;
}) {
  const query = encodeURIComponent(searchQuery || address);
  const src = `https://www.google.com/maps?q=${query}&output=embed`;

  return (
    <div className="neo-card overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b-[3px] border-black bg-[var(--cyan)] p-4">
        <div className="flex items-center gap-2 font-black uppercase">
          <MapPinned size={22} />
          {title}
        </div>
        <a
          className="neo-button bg-white text-xs"
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation size={15} />
          Open Map
        </a>
      </div>
      <iframe title="Paperloop pickup map" src={src} className={`${heightClassName} w-full border-0`} loading="lazy" />
    </div>
  );
}
