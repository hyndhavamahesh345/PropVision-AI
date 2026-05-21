// ── TypeScript type definitions for PropInspect AI ──────────────

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  property_type: "apartment" | "house" | "office" | "commercial" | "villa";
  created_at: string;
  updated_at: string;
  inspection_count: number;
}

export interface Video {
  id: string;
  property_id: string;
  filename: string;
  s3_key?: string;
  s3_url?: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  created_at: string;
}

export type InspectionStatus =
  | "pending"
  | "processing_frames"
  | "running_yolo"
  | "running_sam2"
  | "running_qwen"
  | "aggregating"
  | "generating_report"
  | "completed"
  | "failed";

export interface InspectionJob {
  id: string;
  video_id: string;
  status: InspectionStatus;
  progress: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface InventoryItem {
  id: string;
  room: string;
  object_class: string;
  count: number;
  confidence: number;
  track_ids?: number[];
}

export interface RoomInventory {
  room_name: string;
  items: InventoryItem[];
  total_items: number;
}

export interface InventoryReport {
  job_id: string;
  rooms: Record<string, RoomInventory>;
  total_unique_objects: number;
  total_items: number;
  generated_at: string;
}

export type DamageSeverity = "low" | "medium" | "high" | "critical";
export type DamageType =
  | "crack"
  | "stain"
  | "broken"
  | "missing_fixture"
  | "floor_damage"
  | "water_damage"
  | "mold"
  | "peeling";

export interface DamageDetection {
  id: string;
  job_id: string;
  damage_type: DamageType;
  severity: DamageSeverity;
  confidence: number;
  room: string;
  location_description: string;
  bounding_box?: number[];
  evidence_image_url?: string;
  frame_index: number;
  created_at: string;
}

export interface DamageReport {
  job_id: string;
  damages: DamageDetection[];
  total_damages: number;
  critical_count: number;
  high_count: number;
}

export interface DashboardStats {
  total_properties: number;
  total_inspections: number;
  total_videos_processed: number;
  total_objects_detected: number;
  total_damages: number;
  processing_queue_size: number;
  avg_processing_time_minutes: number;
}

export interface RoomDistribution {
  room: string;
  count: number;
  percentage: number;
}

export interface ObjectFrequency {
  object_class: string;
  total_count: number;
  avg_confidence: number;
}

export interface RecentInspection {
  id: string;
  property_name: string;
  property_address?: string;
  status: InspectionStatus;
  progress: number;
  created_at: string;
  total_objects?: number;
  total_damages?: number;
}

export interface DashboardAnalytics {
  stats: DashboardStats;
  room_distribution: RoomDistribution[];
  top_objects: ObjectFrequency[];
  recent_inspections: RecentInspection[];
  damage_trend: { date: string; count: number }[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface InspectionReport {
  id: string;
  job_id: string;
  json_report: {
    inventory: Record<string, Record<string, number>>;
    inventory_with_confidence: Record<
      string,
      Record<string, { count: number; avg_confidence: number }>
    >;
    damages: DamageDetection[];
    room_summaries: Record<string, string>;
    ai_insights: string[];
    stats: {
      total_frames: number;
      total_objects: number;
      unique_objects: number;
      processing_time_s: number;
    };
  };
  pdf_url?: string;
  summary: string;
  created_at: string;
}

export interface ProgressEvent {
  type: "progress" | "completed" | "error";
  job_id: string;
  progress: number;
  status: InspectionStatus | string;
  message: string;
  result_summary?: {
    total_unique_objects: number;
    total_damages: number;
    rooms_found: string[];
  };
}

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  progressMin: number;
  progressMax: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "extract",
    name: "Frame Extraction",
    description: "FFmpeg extracts key frames from video",
    icon: "🎬",
    progressMin: 0,
    progressMax: 15,
  },
  {
    id: "yolo",
    name: "YOLO Detection",
    description: "YOLO11x detects objects in each frame",
    icon: "🔍",
    progressMin: 15,
    progressMax: 50,
  },
  {
    id: "track",
    name: "ByteTrack Tracking",
    description: "ByteTrack assigns persistent IDs across frames",
    icon: "🎯",
    progressMin: 50,
    progressMax: 55,
  },
  {
    id: "sam2",
    name: "SAM2 Segmentation",
    description: "SAM2 segments objects and damage areas",
    icon: "✂️",
    progressMin: 55,
    progressMax: 65,
  },
  {
    id: "qwen",
    name: "AI Scene Reasoning",
    description: "Qwen2.5-VL classifies rooms and generates insights",
    icon: "🧠",
    progressMin: 65,
    progressMax: 78,
  },
  {
    id: "damage",
    name: "Damage Analysis",
    description: "AI detects cracks, stains, and structural issues",
    icon: "⚠️",
    progressMin: 78,
    progressMax: 82,
  },
  {
    id: "aggregate",
    name: "Inventory Aggregation",
    description: "Deduplication and final inventory assembly",
    icon: "📦",
    progressMin: 82,
    progressMax: 90,
  },
  {
    id: "report",
    name: "Report Generation",
    description: "Generating PDF report and saving results",
    icon: "📄",
    progressMin: 90,
    progressMax: 100,
  },
];
