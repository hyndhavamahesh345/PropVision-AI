'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Building2,
  Video,
  Loader2,
  ChevronLeft,
  Plus,
  Home,
  MapPin,
  Tag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { UploadZone } from '@/components/upload/UploadZone';
import { Navbar } from '@/components/layout/Navbar';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = [
  'Apartment', 'House', 'Villa', 'Studio', 'Penthouse', 'Townhouse', 'Office', 'Commercial',
];

const MOCK_PROPERTIES = [
  { id: 'p1', name: 'Sunset Villa', address: '42 Horizon Blvd, Miami', property_type: 'Villa' },
  { id: 'p2', name: 'Metro Apartment', address: '8 Central Ave, New York', property_type: 'Apartment' },
  { id: 'p3', name: 'Harbor View Condo', address: '17 Port Road, San Francisco', property_type: 'Penthouse' },
];

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Select Property', icon: Building2, description: 'Choose or create a property' },
  { id: 2, label: 'Upload / Record Video', icon: Video, description: 'Upload or record inspection footage' },
  { id: 3, label: 'Processing', icon: Loader2, description: 'AI inspection in progress' },
];

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProp, setNewProp] = useState({ name: '', address: '', property_type: 'Apartment' });
  const [jobId, setJobId] = useState<string | null>(null);

  const handlePropertySelect = (id: string) => {
    setSelectedPropertyId(id);
    setShowCreate(false);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProp.name || !newProp.address) return;
    setCreating(true);
    try {
      const created = await api.createProperty(newProp) as { id: string };
      setSelectedPropertyId(created.id);
      setShowCreate(false);
    } catch {
      // Fallback: use mock id
      setSelectedPropertyId('new-' + Date.now());
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  const handleUploadComplete = (videoId: string, uploadedJobId: string) => {
    setJobId(uploadedJobId);
    setStep(3);
    setTimeout(() => {
      router.push(`/inspections/${uploadedJobId}`);
    }, 2500);
  };

  return (
    <div className="min-h-screen gradient-bg-dark">
      <Navbar />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 animate-fade-in">
          <Link href="/" className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
            <Home className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-300">New Inspection</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Step Indicator Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="glass rounded-2xl p-6 border border-white/8 space-y-2 sticky top-24">
              <div className="mb-6">
                <h1 className="font-heading font-bold text-xl text-white">New Inspection</h1>
                <p className="text-sm text-gray-400 mt-1">Upload or record a video to start AI inspection</p>
              </div>

              {STEPS.map((s, i) => {
                const isActive = step === s.id;
                const isCompleted = step > s.id;
                const isPending = step < s.id;
                const Icon = s.icon;

                return (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200',
                      isActive && 'bg-indigo-500/10 border border-indigo-500/20',
                      isCompleted && 'opacity-70',
                      isPending && 'opacity-40'
                    )}
                  >
                    {/* Step circle */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border text-sm font-bold',
                        isCompleted
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : isActive
                          ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                          : 'bg-white/5 border-white/10 text-gray-600'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isActive && s.id === 3 ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        s.id
                      )}
                    </div>

                    <div>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isActive ? 'text-indigo-200' : isCompleted ? 'text-emerald-300' : 'text-gray-500'
                        )}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-gray-500">{s.description}</p>
                    </div>
                  </div>
                );
              })}

              {/* Connection line decoration */}
              <div className="mt-6 pt-4 border-t border-white/8">
                <p className="text-xs text-gray-600 text-center">
                  Average processing time: <span className="text-gray-400">4–8 minutes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Step 1: Property Selection */}
            {step === 1 && (
              <div className="space-y-5 animate-slide-up">
                <div className="glass rounded-2xl p-6 border border-white/8">
                  <h2 className="font-heading font-semibold text-white text-xl mb-1">
                    Select Property
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Choose which property this inspection is for
                  </p>

                  {/* Property list */}
                  <div className="space-y-3 mb-5">
                    {MOCK_PROPERTIES.map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => handlePropertySelect(prop.id)}
                        className={cn(
                          'w-full flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left',
                          selectedPropertyId === prop.id
                            ? 'border-indigo-500/50 bg-indigo-500/8 glow-indigo'
                            : 'border-white/8 hover:border-white/15 hover:bg-white/3'
                        )}
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                            selectedPropertyId === prop.id
                              ? 'bg-indigo-500/20 border border-indigo-500/40'
                              : 'bg-white/5 border border-white/10'
                          )}
                        >
                          <Building2
                            className={cn(
                              'w-5 h-5',
                              selectedPropertyId === prop.id ? 'text-indigo-400' : 'text-gray-500'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{prop.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <p className="text-xs text-gray-400">{prop.address}</p>
                          </div>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400">
                            {prop.property_type}
                          </span>
                        </div>
                        {selectedPropertyId === prop.id && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Create new property */}
                  {!showCreate ? (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-sm text-gray-400 hover:text-gray-200 hover:border-white/25 hover:bg-white/3 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Property
                    </button>
                  ) : (
                    <form onSubmit={handleCreateProperty} className="glass-dark rounded-xl p-5 border border-white/10 space-y-4 animate-slide-up">
                      <h3 className="font-semibold text-white text-sm">New Property Details</h3>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Property Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sunset Villa"
                            value={newProp.name}
                            onChange={(e) => setNewProp((p) => ({ ...p, name: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 input-focus"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            Address
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 42 Ocean Drive, Miami"
                            value={newProp.address}
                            onChange={(e) => setNewProp((p) => ({ ...p, address: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 input-focus"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Property Type
                          </label>
                          <select
                            value={newProp.property_type}
                            onChange={(e) => setNewProp((p) => ({ ...p, property_type: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white input-focus"
                          >
                            {PROPERTY_TYPES.map((t) => (
                              <option key={t} value={t} className="bg-[#0f1629]">{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCreate(false)}
                          className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creating}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 transition-all"
                        >
                          {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                          Create Property
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Continue button */}
                <button
                  onClick={() => selectedPropertyId && setStep(2)}
                  disabled={!selectedPropertyId}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-300',
                    selectedPropertyId
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-500/25'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'
                  )}
                >
                  Continue to Upload
                  {selectedPropertyId && <CheckCircle2 className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Step 2: Upload */}
            {step === 2 && (
              <div className="space-y-5 animate-slide-up">
                <div className="glass rounded-2xl p-6 border border-white/8">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => setStep(1)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="font-heading font-semibold text-white text-xl">Upload or Record Video</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-6 ml-10">
                    Upload or record your property walkthrough video for AI inspection
                  </p>
                  <UploadZone
                    propertyId={selectedPropertyId || ''}
                    onComplete={handleUploadComplete}
                  />
                </div>

                <div className="glass-dark rounded-xl p-4 border border-white/8 text-sm text-gray-400 space-y-2">
                  <p className="font-medium text-gray-300">💡 Tips for best results:</p>
                  <ul className="space-y-1 text-xs ml-4 list-disc">
                    <li>Walk slowly through each room, pausing 2–3 seconds on each item</li>
                    <li>Ensure good lighting — turn on all room lights</li>
                    <li>Capture all angles of furniture and fixtures</li>
                    <li>Record at 1080p or higher for best detection accuracy</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-6 animate-scale-in">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/15 border-2 border-indigo-500/30 flex items-center justify-center glow-indigo">
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="font-heading font-bold text-2xl text-white">
                    Upload Successful!
                  </h2>
                  <p className="text-gray-400">
                    AI inspection pipeline is starting...
                  </p>
                  <p className="text-sm text-indigo-400 animate-pulse">
                    Redirecting to live tracking
                  </p>
                </div>
                {jobId && (
                  <Link
                    href={`/inspections/${jobId}`}
                    className="px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-500 transition-all"
                  >
                    Go to Live Tracking
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
