'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// ==================== Bar Chart ====================
interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
  showValues?: boolean;
  animated?: boolean;
}

export function BarChart({
  data,
  height = 160,
  className,
  showValues = true,
  animated = true,
}: BarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const defaultColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${data.length * 60} ${height}`}
        className="w-full"
        style={{ height }}
      >
        {data.map((item, i) => {
          const barHeight = (item.value / max) * (height - 30);
          const x = i * 60 + 8;
          const y = height - barHeight - 20;
          const color = item.color || defaultColors[i % defaultColors.length];
          return (
            <g key={item.label}>
              {/* Background bar */}
              <rect
                x={x}
                y={10}
                width={44}
                height={height - 30}
                rx={6}
                fill="rgba(255,255,255,0.03)"
              />
              {/* Value bar */}
              <rect
                x={x}
                y={animated && mounted ? y : height - 20}
                width={44}
                height={animated && mounted ? barHeight : 0}
                rx={6}
                fill={color}
                opacity={0.85}
                style={{
                  transition: animated
                    ? `y 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms, height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`
                    : undefined,
                }}
              />
              {/* Gradient overlay */}
              <rect
                x={x}
                y={animated && mounted ? y : height - 20}
                width={44}
                height={animated && mounted ? barHeight : 0}
                rx={6}
                fill="url(#barGrad)"
                opacity={0.3}
                style={{
                  transition: animated
                    ? `y 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms, height 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`
                    : undefined,
                }}
              />
              {/* Value label */}
              {showValues && (
                <text
                  x={x + 22}
                  y={animated && mounted ? y - 4 : height - 24}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.7)"
                  fontSize="9"
                  style={{
                    transition: animated
                      ? `y 0.8s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`
                      : undefined,
                  }}
                >
                  {item.value}
                </text>
              )}
              {/* X label */}
              <text
                x={x + 22}
                y={height - 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize="8"
              >
                {item.label.length > 6 ? item.label.slice(0, 6) + '…' : item.label}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ==================== Donut / Pie Chart ====================
interface PieChartProps {
  data: ChartDataPoint[];
  size?: number;
  thickness?: number;
  className?: string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export function PieChart({
  data,
  size = 180,
  thickness = 36,
  className,
  showLegend = true,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const defaultColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
  const r = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulativeAngle = -90;

  const slices = data.map((item, i) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    const color = item.color || defaultColors[i % defaultColors.length];

    // SVG arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return { item, color, x1, y1, x2, y2, largeArc, percentage, startAngle, angle };
  });

  const strokeDashoffset = mounted ? 0 : circumference;

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: size, height: size, transform: 'rotate(-90deg)' }}
        >
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={thickness}
          />
          {slices.map(({ item, color, x1, y1, x2, y2, largeArc, percentage }, i) => {
            const dash = circumference * percentage;
            const offset = mounted
              ? circumference - dash - slices.slice(0, i).reduce((s, sl) => s + circumference * sl.percentage, 0)
              : circumference;
            return (
              <circle
                key={item.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={thickness - 2}
                strokeDasharray={`${circumference * percentage} ${circumference}`}
                strokeDashoffset={-slices.slice(0, i).reduce((s, sl) => s + circumference * sl.percentage, 0)}
                strokeLinecap="round"
                style={{
                  transition: mounted
                    ? `stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1) ${i * 100}ms`
                    : undefined,
                  filter: `drop-shadow(0 0 6px ${color}60)`,
                }}
                opacity={0.9}
              />
            );
          })}
        </svg>
        {/* Center label */}
        {(centerLabel || centerValue !== undefined) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <span className="text-2xl font-bold gradient-text">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-gray-400 mt-0.5">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {data.map((item, i) => {
            const color = item.color || defaultColors[i % defaultColors.length];
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-gray-400">{item.label}</span>
                <span className="text-gray-500">({pct}%)</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Horizontal Bar Chart ====================
interface HorizontalBarChartProps {
  data: ChartDataPoint[];
  className?: string;
  showValues?: boolean;
}

export function HorizontalBarChart({
  data,
  className,
  showValues = true,
}: HorizontalBarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const defaultColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={cn('space-y-2.5', className)}>
      {data.map((item, i) => {
        const pct = (item.value / max) * 100;
        const color = item.color || defaultColors[i % defaultColors.length];
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 truncate max-w-[60%]">{item.label}</span>
              {showValues && (
                <span className="text-gray-400 font-mono ml-2">{item.value}</span>
              )}
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: mounted ? `${pct}%` : '0%',
                  background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  boxShadow: `0 0 8px ${color}40`,
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==================== Sparkline ====================
interface SparkLineProps {
  data: { value: number }[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  filled?: boolean;
}

export function SparkLine({
  data,
  width = 100,
  height = 32,
  color = '#6366f1',
  className,
  filled = true,
}: SparkLineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const padding = 4;

  const pts = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - padding * 2);
    const y = padding + ((max - d.value) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const polyline = pts.join(' ');
  const lastPt = pts[pts.length - 1].split(',');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      style={{ width, height }}
    >
      <defs>
        <linearGradient id={`sparkFill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled && (
        <polygon
          points={`${pts[0].split(',')[0]},${height} ${polyline} ${lastPt[0]},${height}`}
          fill={`url(#sparkFill-${color.replace('#', '')})`}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="500"
        strokeDashoffset={mounted ? 0 : 500}
        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
      />
      {/* Endpoint dot */}
      <circle
        cx={lastPt[0]}
        cy={lastPt[1]}
        r="2.5"
        fill={color}
        opacity={mounted ? 1 : 0}
        style={{ transition: 'opacity 0.3s ease 1s' }}
      />
    </svg>
  );
}

// ==================== Line Chart ====================
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  className?: string;
  showGrid?: boolean;
}

export function LineChart({
  data,
  height = 200,
  color = '#6366f1',
  className,
  showGrid = true,
}: LineChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (!data.length) return null;
  const width = 600;
  const padL = 40, padR = 20, padT = 20, padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const range = max - min || 1;

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1 || 1)) * plotW;
    const y = padT + ((max - d.value) / range) * plotH;
    return { x, y, ...d };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="lineAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {showGrid &&
          [0.25, 0.5, 0.75, 1].map((f) => {
            const y = padT + f * plotH;
            return (
              <line
                key={f}
                x1={padL}
                y1={y}
                x2={padL + plotW}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((f) => {
          const y = padT + f * plotH;
          const val = Math.round(max * (1 - f));
          return (
            <text
              key={f}
              x={padL - 6}
              y={y + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.3)"
              fontSize="9"
            >
              {val}
            </text>
          );
        })}

        {/* Area fill */}
        <polygon
          points={`${firstPt.x},${padT + plotH} ${polyline} ${lastPt.x},${padT + plotH}`}
          fill="url(#lineAreaFill)"
          opacity={mounted ? 1 : 0}
          style={{ transition: 'opacity 1s ease-out' }}
        />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="2000"
          strokeDashoffset={mounted ? 0 : 2000}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
          filter={`drop-shadow(0 0 4px ${color})`}
        />

        {/* Data points */}
        {pts.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill={color}
            opacity={mounted ? 0.8 : 0}
            style={{ transition: `opacity 0.2s ease ${0.8 + i * 0.05}s` }}
          />
        ))}

        {/* X labels */}
        {pts
          .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
          .map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={height - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.3)"
              fontSize="9"
            >
              {pt.label.length > 8 ? pt.label.slice(0, 8) : pt.label}
            </text>
          ))}
      </svg>
    </div>
  );
}
