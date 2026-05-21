'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Video,
  X,
  AlertCircle,
  CheckCircle2,
  FileVideo,
  Loader2,
  Camera,
  StopCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  propertyId: string;
  onComplete: (videoId: string, jobId: string) => void;
}

interface FileInfo {
  file: File;
  name: string;
  sizeMB: number;
}

const MAX_SIZE_MB = 500;
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const ACCEPTED_EXT = '.mp4, .mov, .webm, .avi';

type UploadState = 'idle' | 'ready' | 'uploading' | 'success' | 'error';
type InputMode = 'upload' | 'record';

export function UploadZone({ propertyId, onComplete }: UploadZoneProps) {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi)$/i)) {
      return `Invalid file type. Accepted: ${ACCEPTED_EXT}`;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return `File too large. Maximum size: ${MAX_SIZE_MB}MB. Your file: ${sizeMB.toFixed(1)}MB`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setState('error');
      return;
    }
    setError(null);
    setFileInfo({
      file,
      name: file.name,
      sizeMB: file.size / (1024 * 1024),
    });
    setState('ready');
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Recording Handlers
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `recorded_walkthrough_${Date.now()}.webm`, { type: 'video/webm' });
      handleFile(file);
      // Stop stream after recording
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsRecording(false);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const startUpload = async () => {
    if (!fileInfo || !propertyId) return;
    setState('uploading');
    setProgress(0);
    setError(null);

    try {
      const result = await api.uploadVideo(
        propertyId,
        fileInfo.file,
        (p) => setProgress(p)
      );
      setState('success');
      setProgress(100);
      setTimeout(() => {
        onComplete(result.id, result.job_id);
      }, 800);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    }
  };

  const reset = () => {
    setState('idle');
    setFileInfo(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Input Mode Toggle */}
      {(state === 'idle' || state === 'error') && (
        <div className="flex bg-white/5 rounded-xl p-1 gap-1 mb-4">
          <button
            onClick={() => { setInputMode('upload'); if(stream) stream.getTracks().forEach(t => t.stop()); }}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              inputMode === 'upload'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => { setInputMode('record'); startCamera(); }}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              inputMode === 'record'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            <Camera className="w-4 h-4" />
            Record Video
          </button>
        </div>
      )}

      {/* Upload Zone */}
      {(state === 'idle' || state === 'error') && inputMode === 'upload' && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group',
            dragOver
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01] glow-indigo'
              : 'border-white/15 bg-white/2 hover:border-indigo-400/50 hover:bg-white/4',
            state === 'error' && 'border-red-500/40 bg-red-500/5'
          )}
        >
          {/* Animated upload icon */}
          <div
            className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
              dragOver
                ? 'bg-indigo-500/20 scale-110'
                : 'bg-white/5 group-hover:bg-indigo-500/10 group-hover:scale-105'
            )}
          >
            {state === 'error' ? (
              <AlertCircle className="w-10 h-10 text-red-400" />
            ) : (
              <FileVideo
                className={cn(
                  'w-10 h-10 transition-colors duration-300',
                  dragOver ? 'text-indigo-300 animate-float' : 'text-gray-500 group-hover:text-indigo-400'
                )}
              />
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-gray-200">
              {dragOver ? 'Drop your video here' : 'Drag & drop your video'}
            </p>
            <p className="text-sm text-gray-400">
              or{' '}
              <span className="text-indigo-400 font-medium hover:text-indigo-300">
                browse files
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports: {ACCEPTED_EXT} • Max size: {MAX_SIZE_MB}MB
            </p>
          </div>

          {state === 'error' && error && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Record Zone */}
      {(state === 'idle' || state === 'error') && inputMode === 'record' && (
        <div className="glass rounded-2xl p-4 border border-white/8 space-y-4 text-center">
          {error && (
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-600 animate-pulse" />
            )}
            
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500 text-red-400 rounded-full text-xs font-bold animate-pulse">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                RECORDING
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!stream}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-400 text-white font-bold transition-all disabled:opacity-50"
              >
                <Circle className="w-5 h-5 fill-white" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold transition-all"
              >
                <StopCircle className="w-5 h-5" />
                Stop & Save
              </button>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onInputChange}
        className="hidden"
      />

      {/* File Ready State */}
      {state === 'ready' && fileInfo && (
        <div className="glass rounded-2xl p-6 space-y-5 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{fileInfo.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {fileInfo.sizeMB.toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={reset}
              className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={startUpload}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            <Upload className="w-4 h-4" />
            Start AI Inspection
          </button>
        </div>
      )}

      {/* Uploading State */}
      {state === 'uploading' && fileInfo && (
        <div className="glass rounded-2xl p-6 space-y-5 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Uploading video...</p>
              <p className="text-xs text-gray-400 truncate">{fileInfo.name}</p>
            </div>
            <span className="text-lg font-bold gradient-text-indigo">{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {((fileInfo.sizeMB * progress) / 100).toFixed(1)} MB uploaded
              </span>
              <span>{fileInfo.sizeMB.toFixed(1)} MB total</span>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && (
        <div className="glass rounded-2xl p-6 space-y-4 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto glow-emerald">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Upload Complete!</p>
            <p className="text-sm text-gray-400 mt-1">
              Redirecting to live inspection tracking...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
