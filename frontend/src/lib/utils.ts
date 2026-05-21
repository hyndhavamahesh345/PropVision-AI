import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFullDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function capitalize(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    pending: "text-gray-400",
    processing_frames: "text-blue-400",
    running_yolo: "text-indigo-400",
    running_sam2: "text-violet-400",
    running_qwen: "text-cyan-400",
    aggregating: "text-amber-400",
    generating_report: "text-orange-400",
    uploaded: "text-sky-400",
    processing: "text-amber-400",
  };
  return colors[status] || "text-gray-400";
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    completed: "bg-emerald-500/10 border-emerald-500/20",
    failed: "bg-red-500/10 border-red-500/20",
    pending: "bg-gray-500/10 border-gray-500/20",
    processing_frames: "bg-blue-500/10 border-blue-500/20",
    running_yolo: "bg-indigo-500/10 border-indigo-500/20",
    running_sam2: "bg-violet-500/10 border-violet-500/20",
    running_qwen: "bg-cyan-500/10 border-cyan-500/20",
    aggregating: "bg-amber-500/10 border-amber-500/20",
    generating_report: "bg-orange-500/10 border-orange-500/20",
  };
  return colors[status] || "bg-gray-500/10 border-gray-500/20";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    processing_frames: "Extracting Frames",
    running_yolo: "YOLO Detection",
    running_sam2: "SAM2 Segmentation",
    running_qwen: "AI Reasoning",
    aggregating: "Aggregating",
    generating_report: "Generating Report",
    completed: "Completed",
    failed: "Failed",
    uploaded: "Uploaded",
    processing: "Processing",
  };
  return labels[status] || capitalize(status);
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    medium: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    high: "text-red-400 bg-red-400/10 border-red-400/30",
    critical: "text-rose-300 bg-rose-400/20 border-rose-400/50",
  };
  return colors[severity] || "text-gray-400 bg-gray-400/10 border-gray-400/30";
}

export function getSeverityDotColor(severity: string): string {
  const colors: Record<string, string> = {
    low: "bg-yellow-400",
    medium: "bg-orange-400",
    high: "bg-red-400",
    critical: "bg-rose-400",
  };
  return colors[severity] || "bg-gray-400";
}

export function getRoomIcon(room: string): string {
  const icons: Record<string, string> = {
    bedroom: "🛏️",
    living_room: "🛋️",
    kitchen: "🍳",
    bathroom: "🚿",
    office: "💼",
    balcony: "🌿",
    dining_room: "🍽️",
    garage: "🚗",
    laundry: "🫧",
    hallway: "🚪",
    unknown: "🏠",
  };
  return icons[room] || "🏠";
}

export function getRoomColor(room: string): string {
  const colors: Record<string, string> = {
    bedroom: "#818cf8",
    living_room: "#06b6d4",
    kitchen: "#34d399",
    bathroom: "#60a5fa",
    office: "#a78bfa",
    balcony: "#86efac",
    dining_room: "#fbbf24",
    garage: "#94a3b8",
    unknown: "#6b7280",
  };
  return colors[room] || "#6b7280";
}

export function getObjectCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    furniture: "🪑",
    electronics: "📺",
    appliances: "🍽️",
    fixtures: "🚿",
    decor: "🖼️",
  };
  return icons[category] || "📦";
}

export function isProcessing(status: string): boolean {
  return ![
    "completed",
    "failed",
    "pending",
    "uploaded",
  ].includes(status);
}

export function getProgressStage(progress: number): string {
  if (progress < 15) return "processing_frames";
  if (progress < 50) return "running_yolo";
  if (progress < 55) return "running_sam2";
  if (progress < 65) return "running_sam2";
  if (progress < 78) return "running_qwen";
  if (progress < 82) return "aggregating";
  if (progress < 90) return "aggregating";
  return "generating_report";
}
