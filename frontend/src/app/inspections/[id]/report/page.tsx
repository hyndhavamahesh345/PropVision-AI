"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share2,
  Printer,
  ChevronRight,
  Home,
  CheckCircle,
  AlertTriangle,
  Boxes,
  MapPin,
  Calendar,
  Building2,
  FileText,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { cn, formatFullDate, getRoomIcon, getObjectCategoryIcon, getSeverityColor, capitalize } from "@/lib/utils";

// Mock Data
const MOCK_REPORT = {
  id: "rep-001",
  job_id: "job-demo",
  property_name: "88 Horizon Tower, Penthouse",
  property_address: "Delhi, NCR",
  inspection_date: new Date().toISOString(),
  summary:
    "Overall, the property is in excellent condition. High-quality furnishings were detected across all 4 rooms. A few minor damages (wall scratches) were noted in the Living Room and Hallway.",
  stats: {
    total_objects: 127,
    unique_objects: 18,
    rooms_scanned: 4,
    damages_found: 2,
  },
  inventory: {
    living_room: [
      { class: "sofa", count: 2, conf: 0.95 },
      { class: "tv", count: 1, conf: 0.98 },
      { class: "potted_plant", count: 3, conf: 0.88 },
      { class: "chair", count: 4, conf: 0.91 },
      { class: "table", count: 2, conf: 0.89 },
    ],
    bedroom: [
      { class: "bed", count: 1, conf: 0.99 },
      { class: "wardrobe", count: 2, conf: 0.92 },
      { class: "lamp", count: 2, conf: 0.85 },
      { class: "chair", count: 1, conf: 0.88 },
    ],
    kitchen: [
      { class: "refrigerator", count: 1, conf: 0.96 },
      { class: "microwave", count: 1, conf: 0.94 },
      { class: "oven", count: 1, conf: 0.91 },
      { class: "chair", count: 3, conf: 0.86 },
      { class: "dining_table", count: 1, conf: 0.89 },
    ],
    bathroom: [
      { class: "sink", count: 2, conf: 0.95 },
      { class: "toilet", count: 1, conf: 0.98 },
      { class: "mirror", count: 2, conf: 0.82 },
    ],
  },
  damages: [
    {
      id: "dmg-1",
      type: "scratch",
      severity: "low",
      room: "living_room",
      desc: "Minor scratch on the wall behind the main sofa.",
      conf: 0.87,
    },
    {
      id: "dmg-2",
      type: "stain",
      severity: "medium",
      room: "bedroom",
      desc: "Small water stain on the ceiling near the window.",
      conf: 0.92,
    },
  ],
  ai_insights: [
    "The living room features premium leather sofas and a large modern TV.",
    "Kitchen appliances are stainless steel and appear well-maintained.",
    "Bedroom layout maximizes natural light; furniture is symmetrically arranged.",
  ],
};

function StatBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="glass rounded-xl p-4 border flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", color.bg)}>
        <Icon className={cn("w-6 h-6", color.text)} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400 font-medium">{label}</div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [activeTab, setActiveTab] = useState<"summary" | "inventory" | "damages">("summary");

  const data = MOCK_REPORT;

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/8 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-300 font-medium">Reports</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-mono text-gray-500 truncate max-w-[120px]">
              {jobId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Printer className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/20">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-slide-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> AI Verified
              </span>
              <span className="text-xs text-gray-500">
                Generated {formatFullDate(data.inspection_date)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
              {data.property_name}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <MapPin className="w-4 h-4" />
              {data.property_address}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <div className="text-gray-500 text-xs mb-0.5">Inspected By</div>
              <div className="text-gray-300 font-medium flex items-center gap-1.5 justify-end">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                PropInspect AI Engine
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <StatBox
            label="Total Objects"
            value={data.stats.total_objects}
            icon={Boxes}
            color={{ bg: "bg-indigo-500/10", text: "text-indigo-400" }}
          />
          <StatBox
            label="Unique Categories"
            value={data.stats.unique_objects}
            icon={FileText}
            color={{ bg: "bg-cyan-500/10", text: "text-cyan-400" }}
          />
          <StatBox
            label="Rooms Scanned"
            value={data.stats.rooms_scanned}
            icon={Building2}
            color={{ bg: "bg-purple-500/10", text: "text-purple-400" }}
          />
          <StatBox
            label="Damages Found"
            value={data.stats.damages_found}
            icon={AlertTriangle}
            color={{ bg: "bg-amber-500/10", text: "text-amber-400" }}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <nav className="flex gap-6">
            {(["summary", "inventory", "damages"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 text-sm font-medium capitalize transition-colors relative",
                  activeTab === tab
                    ? "text-white tab-active"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {tab}
                {tab === "damages" && data.stats.damages_found > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">
                    {data.stats.damages_found}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Executive Summary
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {data.summary}
                </p>
              </div>

              <div className="glass rounded-2xl p-6 border">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  AI Observations (Qwen2.5-VL)
                </h3>
                <ul className="space-y-3">
                  {data.ai_insights.map((insight, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="shrink-0 text-indigo-400">✧</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="space-y-6">
              {Object.entries(data.inventory).map(([room, items]) => (
                <div key={room} className="glass rounded-2xl border overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 bg-white/2 flex items-center gap-3">
                    <span className="text-xl">{getRoomIcon(room)}</span>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {room.replace("_", " ")}
                    </h3>
                    <span className="ml-auto text-xs font-medium text-gray-500 bg-black/20 px-2 py-1 rounded-md">
                      {items.reduce((s, i) => s + i.count, 0)} items
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {items.map((item, i) => (
                        <div key={i} className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors">
                          <span className="text-2xl mb-2">{getObjectCategoryIcon("furniture")}</span>
                          <span className="text-sm font-medium text-white capitalize mb-1">
                            {item.class.replace("_", " ")}
                          </span>
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                              x{item.count}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {Math.round(item.conf * 100)}% conf
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "damages" && (
            <div className="space-y-4">
              {data.damages.length === 0 ? (
                <div className="glass rounded-2xl border p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Damages Detected</h3>
                  <p className="text-sm text-gray-400">The AI did not find any structural or surface damages in this property.</p>
                </div>
              ) : (
                data.damages.map((damage) => (
                  <div key={damage.id} className="glass rounded-2xl border p-5 flex gap-5 items-start">
                    <div className="w-32 h-24 rounded-lg bg-black/40 border border-white/10 flex flex-col items-center justify-center shrink-0">
                      <ShieldAlert className="w-6 h-6 text-gray-600 mb-2" />
                      <span className="text-[10px] text-gray-500">Image Evidence</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider", getSeverityColor(damage.severity))}>
                            {damage.severity} SEVERITY
                          </span>
                          <span className="text-sm font-semibold text-white capitalize">
                            {damage.type}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                          {Math.round(damage.conf * 100)}% Confidence
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-3">{damage.desc}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 capitalize bg-white/5 inline-flex px-2 py-1 rounded border border-white/5">
                        <MapPin className="w-3 h-3" />
                        {damage.room.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
