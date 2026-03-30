import TimelineFeed from '@/components/TimelineFeed';

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  return (
    <div className="p-6">
      <TimelineFeed />
    </div>
  );
}
