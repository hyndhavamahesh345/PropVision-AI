'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';
import { cn, getRoomIcon, capitalize, formatConfidence } from '@/lib/utils';

const CATEGORIES: Record<string, string[]> = {
  Furniture: ['chair', 'sofa', 'bed', 'table', 'desk', 'shelf', 'cabinet', 'wardrobe', 'couch', 'bench', 'stool', 'ottoman'],
  Electronics: ['tv', 'monitor', 'laptop', 'computer', 'phone', 'speaker', 'router', 'keyboard', 'mouse', 'fan', 'ac', 'projector'],
  Appliances: ['refrigerator', 'washing_machine', 'microwave', 'oven', 'dishwasher', 'dryer', 'blender', 'toaster', 'kettle'],
  Fixtures: ['sink', 'toilet', 'bathtub', 'shower', 'light', 'lamp', 'door', 'window', 'curtain', 'mirror', 'tap', 'faucet'],
  Decor: ['plant', 'painting', 'photo', 'rug', 'pillow', 'cushion', 'vase', 'clock', 'book', 'candle'],
};

function getCategory(objectClass: string): string {
  const lower = objectClass.toLowerCase();
  for (const [cat, items] of Object.entries(CATEGORIES)) {
    if (items.some((item) => lower.includes(item))) return cat;
  }
  return 'Other';
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 90
      ? 'bg-emerald-500'
      : pct >= 70
      ? 'bg-amber-500'
      : 'bg-red-500';
  const textColor =
    pct >= 90
      ? 'text-emerald-400'
      : pct >= 70
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-[10px] font-mono font-semibold', textColor)}>
        {pct}%
      </span>
    </div>
  );
}

interface InventoryCardProps {
  room: string;
  items: InventoryItem[];
  defaultExpanded?: boolean;
}

export function InventoryCard({
  room,
  items,
  defaultExpanded = true,
}: InventoryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Group items by category
  const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const cat = getCategory(item.object_class);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalItems = items.reduce((s, i) => s + i.count, 0);
  const avgConfidence =
    items.length > 0
      ? items.reduce((s, i) => s + i.confidence, 0) / items.length
      : 0;

  const roomEmoji = getRoomIcon(room);
  const catColors: Record<string, string> = {
    Furniture: '#6366f1',
    Electronics: '#06b6d4',
    Appliances: '#10b981',
    Fixtures: '#f59e0b',
    Decor: '#8b5cf6',
    Other: '#6b7280',
  };

  return (
    <div className="glass rounded-2xl overflow-hidden card-hover border border-white/8 transition-all duration-300">
      {/* Room Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-white/3 transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
          {roomEmoji}
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-heading font-semibold text-white text-base">
            {capitalize(room)}
          </h3>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-400">
              {items.length} unique objects
            </span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{totalItems} total items</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-emerald-400">
              {formatConfidence(avgConfidence)} avg confidence
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold">
            {totalItems} items
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Items Content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="space-y-2">
              {/* Category header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: catColors[cat] || '#6b7280' }}
                />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {cat}
                </span>
                <span className="text-xs text-gray-600">({catItems.length})</span>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="glass-dark rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-200 capitalize">
                          {capitalize(item.object_class)}
                        </span>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{
                          background: `${catColors[cat] || '#6b7280'}20`,
                          color: catColors[cat] || '#6b7280',
                        }}
                      >
                        ×{item.count}
                      </span>
                    </div>
                    <ConfidenceBar confidence={item.confidence} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Summary footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-xs text-gray-500">
              Room total: <span className="text-white font-semibold">{totalItems} items</span>
            </span>
            <span className="text-xs text-gray-500">
              Avg confidence:{' '}
              <span
                className={cn(
                  'font-semibold',
                  avgConfidence >= 0.9
                    ? 'text-emerald-400'
                    : avgConfidence >= 0.7
                    ? 'text-amber-400'
                    : 'text-red-400'
                )}
              >
                {formatConfidence(avgConfidence)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
