"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Boxes, CheckCircle2 } from "lucide-react";

const MOCK_DETECTED_OBJECTS = [
  "Sofa",
  "Television (TV)",
  "Coffee Table",
  "Dining Chair",
  "Dining Table",
  "Refrigerator",
  "Microwave",
  "Bed",
  "Wardrobe",
  "Ceiling Fan",
  "Window Curtains",
  "Kitchen Cabinet",
  "Washing Machine",
  "Room Door",
  "Switch Board"
];

export default function SimpleResultsPage() {
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Simulate preprocessing time
    const timer = setTimeout(() => {
      setProcessing(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        
        {processing ? (
          <div className="glass rounded-3xl p-12 text-center border border-white/10 shadow-2xl animate-in fade-in zoom-in-95">
            <Loader2 className="w-16 h-16 text-indigo-400 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
              Preprocessing Video...
            </h2>
            <p className="text-gray-400">Extracting frames and running AI object detection.</p>
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
              <p className="text-gray-400">Direct names of items found in the property video.</p>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-white">Inventory List ({MOCK_DETECTED_OBJECTS.length})</h3>
              </div>
              
              <ul className="grid grid-cols-2 gap-3">
                {MOCK_DETECTED_OBJECTS.map((obj, i) => (
                  <li 
                    key={i} 
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 flex items-center hover:bg-white/10 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/" 
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
