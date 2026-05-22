'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, Camera } from 'lucide-react';
import { api } from '@/lib/api';

const MAX_SIZE_MB = 500;
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface FileInfo {
  file: File;
  name: string;
  sizeMB: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi)$/i)) {
      return 'Invalid file type';
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return `File too large`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setState('error');
      return;
    }
    setError(null);
    
    const fileInfo: FileInfo = { file, name: file.name, sizeMB: file.size / (1024 * 1024) };
    await startUpload(fileInfo);
  };

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
      setError('Camera access denied');
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

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `video_${Date.now()}.${ext}`, { type: mimeType });
        
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
        
        await handleFile(file);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError('Recording failed');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const startUpload = async (fileInfo: FileInfo) => {
    setState('uploading');
    setProgress(0);
    setError(null);

    try {
      const propertyId = "prop_123";
      const result = await api.uploadVideo(propertyId, fileInfo.file, (p) => setProgress(p));
      
      setState('success');
      setProgress(100);
      
      setTimeout(() => {
        router.push(`/inspections/${result.job_id || 'test'}`);
      }, 1500);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setState('idle');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      {state === 'idle' && !stream && (
        <div className="w-full max-w-md text-center space-y-6">
          <h1 className="text-4xl font-bold text-white">Upload or Record</h1>
          
          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <Upload className="w-6 h-6" />
              Upload Video
            </button>

            <button
              onClick={startCamera}
              className="w-full py-6 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <Camera className="w-6 h-6" />
              Record Video
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </div>
      )}

      {/* Recording Interface */}
      {stream && !isRecording && state === 'idle' && (
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video border-2 border-white flex items-center justify-center mb-4">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={startRecording}
              className="flex-1 py-4 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition-all"
            >
              Start Recording
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-4 px-4 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-bold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recording Active */}
      {stream && isRecording && state === 'idle' && (
        <div className="w-full max-w-md">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video border-2 border-red-500 flex items-center justify-center mb-4 relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 text-red-500 font-bold text-lg animate-pulse">● REC</div>
          </div>
          
          <button
            onClick={stopRecording}
            className="w-full py-4 px-4 rounded-xl bg-white text-black font-bold transition-all hover:bg-gray-200"
          >
            Stop Recording
          </button>
        </div>
      )}

      {/* Uploading */}
      {state === 'uploading' && (
        <div className="w-full max-w-md text-center space-y-6">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
          <p className="text-white text-lg font-bold">Processing...</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-indigo-500 h-2 rounded-full transition-all" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-gray-400">{progress}%</p>
        </div>
      )}

      {/* Success */}
      {state === 'success' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Processing...</h2>
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div className="w-full max-w-md text-center space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button
            onClick={() => { setState('idle'); setError(null); }}
            className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      <input 
        ref={fileInputRef} 
        type="file" 
        accept={ACCEPTED_TYPES.join(',')} 
        onChange={onInputChange} 
        className="hidden" 
      />
    </div>
  );
}
