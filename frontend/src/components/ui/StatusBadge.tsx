import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
}

export function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const dotColor =
    status === 'completed'
      ? 'bg-emerald-500'
      : status === 'failed'
      ? 'bg-red-500'
      : status === 'pending'
      ? 'bg-gray-500'
      : 'bg-amber-500 animate-pulse';

  return (
    <div className="flex items-center gap-1.5">
      {showDot && (
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
          aria-hidden="true"
        />
      )}
      <span className={`text-sm font-medium ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </span>
    </div>
  );
}
