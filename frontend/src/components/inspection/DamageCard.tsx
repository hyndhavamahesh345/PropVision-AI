'use client';
import { useState } from 'react';
import {
  AlertTriangle,
  Droplets,
  Hammer,
  Layers,
  Wind,
  CheckCircle2,
  MapPin,
  Eye,
  Filter,
} from 'lucide-react';
import type { DamageDetection, DamageSeverity } from '@/lib/types';
import { cn, getSeverityColor, capitalize } from '@/lib/utils';

const DAMAGE_ICONS: Record<string, React.ElementType> = {
  crack: Hammer,
  stain: Droplets,
  broken: AlertTriangle,
  missing_fixture: Layers,
  floor_damage: AlertTriangle,
  water_damage: Droplets,
  mold: Wind,
  peeling: Layers,
};

const SEVERITY_ORDER: DamageSeverity[] = ['critical', 'high', 'medium', 'low'];

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

interface DamageCardProps {
  damages: DamageDetection[];
  className?: string;
}

export function DamageCard({ damages, className }: DamageCardProps) {
  const [activeFilter, setActiveFilter] = useState<DamageSeverity | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (damages.length === 0) {
    return (
      <div
        className={cn(
          'glass rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4',
          className
        )}
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center glow-emerald mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold text-white">
            No Damages Detected
          </h3>
          <p className="text-sm text-gray-400 mt-2 max-w-sm">
            The AI analysis found no visible damage, cracks, stains, or structural
            issues in this property.
          </p>
        </div>
        <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
          Property in excellent condition
        </div>
      </div>
    );
  }

  // Severity counts
  const severityCounts = SEVERITY_ORDER.reduce<Record<string, number>>(
    (acc, sev) => {
      acc[sev] = damages.filter((d) => d.severity === sev).length;
      return acc;
    },
    {}
  );

  const filtered =
    activeFilter === 'all'
      ? [...damages].sort((a, b) =>
          SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
        )
      : damages.filter((d) => d.severity === activeFilter);

  return (
    <div className={cn('space-y-5', className)}>
      {/* Summary bar */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="font-medium text-white">{damages.length}</span> total issues
        </div>
        <div className="flex-1" />
        {SEVERITY_ORDER.map((sev) => {
          if (!severityCounts[sev]) return null;
          const colorClasses = getSeverityColor(sev);
          return (
            <div
              key={sev}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold',
                colorClasses
              )}
            >
              <span>{severityCounts[sev]}</span>
              <span>{SEVERITY_LABELS[sev]}</span>
            </div>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {(['all', ...SEVERITY_ORDER] as const).map((sev) => (
          <button
            key={sev}
            onClick={() => setActiveFilter(sev)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border',
              activeFilter === sev
                ? sev === 'all'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : getSeverityColor(sev)
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/8'
            )}
          >
            {sev === 'all' ? `All (${damages.length})` : `${SEVERITY_LABELS[sev]} (${severityCounts[sev] || 0})`}
          </button>
        ))}
      </div>

      {/* Damage cards */}
      <div className="space-y-3">
        {filtered.map((damage) => {
          const Icon = DAMAGE_ICONS[damage.damage_type] || AlertTriangle;
          const colorClasses = getSeverityColor(damage.severity);
          const isExpanded = expandedId === damage.id;

          return (
            <div
              key={damage.id}
              className={cn(
                'glass rounded-2xl border transition-all duration-300 overflow-hidden',
                damage.severity === 'critical'
                  ? 'border-rose-500/30'
                  : damage.severity === 'high'
                  ? 'border-red-500/25'
                  : damage.severity === 'medium'
                  ? 'border-orange-500/25'
                  : 'border-yellow-500/20'
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : damage.id)}
                className="w-full flex items-start gap-4 p-4 hover:bg-white/2 transition-all text-left"
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0',
                    colorClasses
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {capitalize(damage.damage_type)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-400">
                          {capitalize(damage.room)} — {damage.location_description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold border',
                          colorClasses
                        )}
                      >
                        {damage.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {Math.round(damage.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3 animate-slide-up">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="glass-dark rounded-lg p-3">
                      <p className="text-gray-500 mb-0.5">Frame Index</p>
                      <p className="text-white font-mono font-semibold">
                        #{damage.frame_index}
                      </p>
                    </div>
                    <div className="glass-dark rounded-lg p-3">
                      <p className="text-gray-500 mb-0.5">AI Confidence</p>
                      <p
                        className={cn(
                          'font-semibold',
                          damage.confidence >= 0.9
                            ? 'text-emerald-400'
                            : damage.confidence >= 0.7
                            ? 'text-amber-400'
                            : 'text-red-400'
                        )}
                      >
                        {Math.round(damage.confidence * 100)}%
                      </p>
                    </div>
                  </div>

                  {damage.evidence_image_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={damage.evidence_image_url}
                        alt={`Evidence: ${damage.damage_type}`}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 text-xs text-white">
                        <Eye className="w-3 h-3" />
                        Evidence Frame
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 rounded-xl border border-white/8 bg-white/2 flex items-center justify-center text-gray-600 text-xs">
                      No evidence image available
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
