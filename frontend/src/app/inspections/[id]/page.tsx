"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, Boxes, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const formatItemsList = (items: any[]): string[] => {
  if (!Array.isArray(items)) return [];

  const formatted = items.map((item: any) => {
    let rawName = "";
    if (typeof item === "string") {
      rawName = item;
    } else if (item && typeof item === "object") {
      rawName = item.item || item.name || "";
    } else {
      rawName = String(item);
    }

    if (!rawName) return "";

    // Normalize lowercase and trim
    let name = rawName.trim().toLowerCase();

    // 1. Strip off "- Detected via..." suffix if present
    if (name.includes(" - detected")) {
      name = name.split(" - detected")[0].trim();
    } else if (name.includes("- detected")) {
      name = name.split("- detected")[0].trim();
    } else if (name.includes("detected via")) {
      name = name.split("detected via")[0].trim();
    }

    // Also generic split by "-" just in case
    if (name.includes(" - ")) {
      name = name.split(" - ")[0].trim();
    }

    // 2. Strip off quantity indicators like "(x2)", "(x1)", "x2", "x1"
    name = name.replace(/\(x\d+\)/g, "").trim();
    name = name.replace(/\bx\d+\b/g, "").trim();
    name = name.replace(/\b\d+x\b/g, "").trim();

    // 3. Filter out unwanted items
    const lowerName = name.trim();
    if (!lowerName || 
        lowerName === "person" || 
        lowerName === "human" || 
        lowerName === "people" || 
        lowerName === "user") {
      return "";
    }

    // 4. Map to premium, aesthetic display names as per the user's screenshots
    const mappings: Record<string, string> = {
      "tv": "Television (TV)",
      "television": "Television (TV)",
      "television (tv)": "Television (TV)",
      "couch": "Sofa",
      "sofa": "Sofa",
      "coffee_table": "Coffee Table",
      "coffee table": "Coffee Table",
      "dining_chair": "Dining Chair",
      "dining chair": "Dining Chair",
      "chair": "Dining Chair",
      "dining_table": "Dining Table",
      "dining table": "Dining Table",
      "table": "Dining Table",
      "refrigerator": "Refrigerator",
      "fridge": "Refrigerator",
      "microwave": "Microwave",
      "bed": "Bed",
      "wardrobe": "Wardrobe",
      "ceiling_fan": "Ceiling Fan",
      "ceiling fan": "Ceiling Fan",
      "fan": "Ceiling Fan",
      "window_curtains": "Window Curtains",
      "window curtains": "Window Curtains",
      "curtains": "Window Curtains",
      "curtain": "Window Curtains",
      "kitchen_cabinet": "Kitchen Cabinet",
      "kitchen cabinet": "Kitchen Cabinet",
      "cabinet": "Kitchen Cabinet",
      "washing_machine": "Washing Machine",
      "washing machine": "Washing Machine",
      "room_door": "Room Door",
      "room door": "Room Door",
      "door": "Room Door",
      "switch_board": "Switch Board",
      "switch board": "Switch Board",
      "plant": "Potted Plant",
      "potted_plant": "Potted Plant",
      "potted plant": "Potted Plant",
      "phone": "Phone",
      "cell_phone": "Phone",
      "cell phone": "Phone"
    };

    if (mappings[lowerName]) {
      return mappings[lowerName];
    }

    // Fallback capitalizing word by word
    return lowerName
      .replace(/[_-]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  });

  // Deduplicate and filter out empty strings
  return Array.from(new Set(formatted.filter(Boolean)));
};

export default function SimpleResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [rawResult, setRawResult] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    let intervalId: any = null;

    const checkStatus = async () => {
      try {
        const data: any = await api.getInspection(id);
        setStatus(data.status);

        if (data.status === "completed" || data.status === "failed") {
          if (intervalId) clearInterval(intervalId);
          if (data.status === "failed") {
            setError(data.error || "Inspection failed.");
          } else if (data.result) {
            setRawResult(data.result);
            
            // Try to extract detected objects from the result
            if (Array.isArray(data.result.inventory)) {
               setDetectedObjects(formatItemsList(data.result.inventory));
            } else if (data.result.detected_objects) {
               setDetectedObjects(formatItemsList(data.result.detected_objects));
            } else {
               // Fallback: just show keys or stringify
               setDetectedObjects(["Check raw result for details."]);
            }
          }
        }
      } catch (err: any) {
        if (intervalId) clearInterval(intervalId);
        setError(err.message || "Failed to fetch inspection status. Is the backend running?");
        setStatus("error");
      }
    };

    // Initial check
    checkStatus();
    // Poll every 3 seconds
    intervalId = setInterval(checkStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id]);

  const isProcessing = status === "pending" || status === "processing";

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {isProcessing && !error ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/10 shadow-2xl animate-in fade-in zoom-in-95">
            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
              Processing Video...
            </h2>
            <p className="text-gray-400">Extracting frames and running AI object detection.</p>
            <p className="text-xs text-indigo-300 mt-4 animate-pulse">This might take a few minutes depending on hardware.</p>
          </div>
        ) : error || status === "error" || status === "failed" ? (
          <div className="glass rounded-3xl p-12 text-center border border-red-500/20 shadow-2xl animate-in fade-in zoom-in-95">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
              Processing Error
            </h2>
            <p className="text-red-300 bg-red-900/20 p-4 rounded-xl border border-red-500/20 break-words">{error}</p>
            <div className="mt-8">
              <Link href="/upload" className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Try Again
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
                Detected Objects
              </h1>
              <p className="text-gray-400">Items found in the property video.</p>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white">Inventory List ({detectedObjects.length})</h3>
              </div>
              
              <ul className="grid grid-cols-2 gap-3">
                {detectedObjects.map((obj, i) => (
                  <li 
                    key={i} 
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 flex items-center hover:bg-white/10 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3 shrink-0" />
                    <span className="truncate" title={obj}>{obj}</span>
                  </li>
                ))}
              </ul>

              {rawResult && !detectedObjects.length && (
                 <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5 text-xs text-gray-400 overflow-auto max-h-40">
                    <pre>{JSON.stringify(rawResult, null, 2)}</pre>
                 </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/upload" 
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Upload
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
