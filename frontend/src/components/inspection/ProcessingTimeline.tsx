'use client';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Film,
  Scan,
  Route,
  Layers,
  Brain,
  ShieldAlert,
  BarChart2,
  FileText,
} from 'lucide-react';
import { cn, getStatusLabel } from '@/lib/utils';

interface Stage {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  progressRange: [number, number]; // [start%, end%]
}

const STAGES: Stage[] = [
  {
    id: 'processing_frames',
    label: 'Frame Extraction',
    description: 'Extracting key frames from video at optimal intervals',
    icon: Film,
    progressRange: [5, 15],
  },
  {
    id: 'running_yolo',
    label: 'YOLO Detection',
    description: 'Detecting all objects with YOLOv8 neural network',
    icon: Scan,
    progressRange: [15, 50],
  },
  {
    id: 'bytetrack',
    label: 'ByteTrack Tracking',
    description: 'Tracking objects across frames to eliminate duplicates',
    icon: Route,
    progressRange: [50, 55],
  },
  {
    id: 'running_sam2',
    label: 'SAM2 Segmentation',
    description: 'Precise pixel-level segmentation of each object',
    icon: Layers,
    progressRange: [55, 65],
  },
  {
    id: 'running_qwen',
    label: 'Qwen AI Reasoning',
    description: 'Multimodal AI analyzing objects and generating descriptions',
    icon: Brain,
    progressRange: [65, 78],
  },
  {
    id: 'damage_analysis',
    label: 'Damage Analysis',
    description: 'Identifying cracks, stains, and structural damage',
    icon: ShieldAlert,
    progressRange: [78, 82],
  },
  {
    id: 'aggregating',
    label: 'Inventory Aggregation',
    description: 'Compiling room-by-room inventory data',
    icon: BarChart2,
    progressRange: [82, 90],
  },
  {
    id: 'generating_report',
    label: 'Report Generation',
    description: 'Generating comprehensive PDF inspection report',
    icon: FileText,
    progressRange: [90, 100],
  },
];

type StageStatus = 'pending' | 'active' | 'completed' | 'failed';

function getStageStatus(
  stage: Stage,
  progress: number,
  currentStatus: string,
  failed: boolean
): StageStatus {
  if (failed && currentStatus === stage.id) return 'failed';
  if (progress >= stage.progressRange[1]) return 'completed';
  if (
    progress >= stage.progressRange[0] ||
    currentStatus === stage.id
  )
    return 'active';
  return 'pending';
}

interface ProcessingTimelineProps {
  progress: number;
  status: string;
  message?: string;
  className?: string;
}

export function ProcessingTimeline({
  progress,
  status,
  message,
  className,
}: ProcessingTimelineProps) {
  const failed = status === 'failed';
  const completed = status === 'completed';

  return (
    <div className={cn('glass rounded-2xl p-6 space-y-6', className)}>
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-white text-lg">
              AI Processing Pipeline
            </h3>
            {message && (
              <p className="text-sm text-gray-400 mt-0.5">{message}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold gradient-text">{progress}%</span>
            <p className="text-xs text-gray-500 mt-0.5">{getStatusLabel(status)}</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              failed
                ? 'bg-gradient-to-r from-red-500 to-red-400'
                : completed
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                : 'bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stage Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-white/8" />

        <div className="space-y-1">
          {STAGES.map((stage, i) => {
            const stageStatus = getStageStatus(stage, progress, status, failed);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={cn(
                  'relative flex items-start gap-4 px-4 py-3 rounded-xl transition-all duration-300',
                  stageStatus === 'active' && 'bg-indigo-500/8 border border-indigo-500/20',
                  stageStatus === 'completed' && 'opacity-70',
                  stageStatus === 'pending' && 'opacity-40',
                  stageStatus === 'failed' && 'bg-red-500/8 border border-red-500/20',
                )}
              >
                {/* Stage indicator */}
                <div className="relative z-10 flex-shrink-0 mt-0.5">
                  {stageStatus === 'completed' ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : stageStatus === 'active' ? (
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center glow-indigo">
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    </div>
                  ) : stageStatus === 'failed' ? (
                    <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Circle className="w-3 h-3 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'w-3.5 h-3.5 flex-shrink-0',
                        stageStatus === 'active'
                          ? 'text-indigo-400'
                          : stageStatus === 'completed'
                          ? 'text-emerald-400'
                          : stageStatus === 'failed'
                          ? 'text-red-400'
                          : 'text-gray-600'
                      )}
                    />
                    <p
                      className={cn(
                        'text-sm font-semibold leading-none',
                        stageStatus === 'active'
                          ? 'text-indigo-200'
                          : stageStatus === 'completed'
                          ? 'text-emerald-300'
                          : stageStatus === 'failed'
                          ? 'text-red-300'
                          : 'text-gray-500'
                      )}
                    >
                      {stage.label}
                    </p>
                    {stageStatus === 'active' && (
                      <div className="flex gap-0.5 ml-1">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">
                    {stage.description}
                  </p>

                  {/* Active stage progress */}
                  {stageStatus === 'active' && (
                    <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            100,
                            ((progress - stage.progressRange[0]) /
                              (stage.progressRange[1] - stage.progressRange[0])) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Progress badge */}
                <div className="text-right flex-shrink-0 pt-1.5">
                  <span className="text-xs text-gray-500 font-mono">
                    {stage.progressRange[0]}–{stage.progressRange[1]}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
