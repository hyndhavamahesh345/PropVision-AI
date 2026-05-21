'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Boxes,
  Circle
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// --- Configuration ---
const MAX_SIZE_MB = 500;
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const ACCEPTED_EXT = '.mp4, .mov, .webm, .avi';

type UploadState = 'idle' | 'ready' | 'uploading' | 'success' | 'error';
type InputMode = 'upload' | 'record';

interface FileInfo {
  file: File;
  name: string;
  sizeMB: number;
}

export default function SimpleUploadPage() {
  const router = useRouter();
  
  // States
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera States
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi)$/i)) {
      return `Invalid file type. Accepted: ${ACCEPTED_EXT}`;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return `File too large. Maximum size: ${MAX_SIZE_MB}MB`;
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
    setFileInfo({ file, name: file.name, sizeMB: file.size / (1024 * 1024) });
    setState('ready');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Recording Logic
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
    try {
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `recorded_walkthrough_${Date.now()}.${ext}`, { type: mimeType });
        handleFile(file);
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError('Recording failed. Your browser might not support video recording.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const startUpload = async () => {
    if (!fileInfo) return;
    setState('uploading');
    setProgress(0);
    setError(null);

    try {
      // Mock property ID since user just wants upload
      const propertyId = "prop_123"; 
      const result = await api.uploadVideo(propertyId, fileInfo.file, (p) => setProgress(p));
      
      setState('success');
      setProgress(100);
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/inspections/${result.job_id || 'test'}`);
      }, 1500);
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
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
            Property Inventory AI
          </h1>
          <p className="text-gray-400">Upload or record a walkthrough video to generate an inventory.</p>
        </div>

        {/* Upload/Record Box */}
        <div className="glass rounded-3xl p-2 sm:p-6 shadow-2xl border border-white/10 relative overflow-hidden">
          
          {/* Mode Toggle */}
          {(state === 'idle' || state === 'error') && (
            <div className="flex bg-black/40 rounded-xl p-1 mb-6 border border-white/5">
              <button
                onClick={() => { setInputMode('upload'); if(stream) stream.getTracks().forEach(t => t.stop()); }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  inputMode === 'upload' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Upload className="w-4 h-4" /> Upload Video
              </button>
              <button
                onClick={() => { setInputMode('record'); startCamera(); }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  inputMode === 'record' ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-200"
                )}
              >
                <Camera className="w-4 h-4" /> Record Video
              </button>
            </div>
          )}

          {/* UPLOAD MODE */}
          {(state === 'idle' || state === 'error') && inputMode === 'upload' && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center gap-4 py-16 px-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 group',
                dragOver ? 'border-indigo-400 bg-indigo-500/10' : 'border-white/15 bg-white/5 hover:border-indigo-400/50 hover:bg-white/10',
                state === 'error' && 'border-red-500/40 bg-red-500/5'
              )}
            >
              <FileVideo className={cn("w-12 h-12 transition-all", dragOver ? 'text-indigo-400 scale-110' : 'text-gray-500 group-hover:text-indigo-400')} />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-200 mb-1">
                  {dragOver ? 'Drop video here' : 'Drag & drop a video'}
                </p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
            </div>
          )}

          {/* RECORD MODE */}
          {(state === 'idle' || state === 'error') && inputMode === 'record' && (
            <div className="rounded-2xl overflow-hidden bg-black relative aspect-video border border-white/10 flex items-center justify-center shadow-inner">
              {stream ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-12 h-12 text-gray-700 animate-pulse" />
              )}
              
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500 text-red-400 rounded-full text-xs font-bold animate-pulse backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> REC
                </div>
              )}
              
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!stream}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-400 text-white font-bold transition-all disabled:opacity-0 shadow-lg shadow-red-500/20"
                  >
                    <Circle className="w-5 h-5 fill-white" /> Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold backdrop-blur-md transition-all"
                  >
                    <StopCircle className="w-5 h-5" /> Stop & Upload
                  </button>
                )}
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={onInputChange} className="hidden" />

          {/* Errors */}
          {state === 'error' && error && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* READY STATE */}
          {state === 'ready' && fileInfo && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{fileInfo.name}</p>
                  <p className="text-xs text-gray-400">{fileInfo.sizeMB.toFixed(1)} MB</p>
                </div>
                <button onClick={reset} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={startUpload}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-lg"
              >
                <Upload className="w-5 h-5" /> Start Processing
              </button>
            </div>
          )}

          {/* UPLOADING STATE */}
          {state === 'uploading' && fileInfo && (
            <div className="animate-in fade-in zoom-in-95 duration-500 py-8 text-center space-y-6">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
              <div>
                <p className="text-white font-semibold mb-1">Uploading Video...</p>
                <p className="text-sm text-gray-400">{fileInfo.name}</p>
              </div>
              <div className="w-full max-w-xs mx-auto">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-indigo-400">{progress}%</span>
                  <span className="text-gray-500">
                    {((fileInfo.sizeMB * progress) / 100).toFixed(1)} / {fileInfo.sizeMB.toFixed(1)} MB
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {state === 'success' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">Upload Complete!</h3>
              <p className="text-gray-400">Processing video through AI models...</p>
              <div className="pt-4 flex justify-center">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
