"use client";

import Link from "next/link";
import { ArrowLeft, Download, Video, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function InventoryReportPage({ params }: { params: { id: string } }) {
  // Mock Data
  const report = {
    property_id: "123 Azure Avenue, Unit 4B",
    date: "Today, 10:24 AM",
    status: "Completed",
    inventory: {
      "Living Room": [
        { id: 1, class: "Sofa", count: 1, confidence: 96, status: "Verified" },
        { id: 2, class: "TV", count: 1, confidence: 99, status: "Verified" },
        { id: 3, class: "Chair", count: 2, confidence: 91, status: "Verified" }
      ],
      "Master Bedroom": [
        { id: 4, class: "Bed", count: 1, confidence: 98, status: "Verified" },
        { id: 5, class: "Wardrobe", count: 1, confidence: 88, status: "Review Needed" }
      ],
      "Kitchen": [
        { id: 6, class: "Refrigerator", count: 1, confidence: 95, status: "Verified" },
        { id: 7, class: "Dining Table", count: 1, confidence: 92, status: "Verified" }
      ]
    },
    scene_summary: "Spacious furnished living room connected to an open kitchen. Standard master bedroom setup. No visible damage to major appliances."
  };

  return (
    <div className="flex flex-col min-h-screen pb-12">
      {/* Navbar Minimal */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/50 backdrop-blur-md">
        <div className="container flex h-16 max-w-7xl items-center justify-between px-4 mx-auto">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/10 text-white">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 mb-3 px-3 py-1">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Inspection Completed
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-white">{report.property_id}</h1>
            <p className="text-muted-foreground mt-1">Processed {report.date}</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Source Video</p>
              <p className="text-xs text-indigo-400 hover:underline cursor-pointer">walkthrough_vid.mp4</p>
            </div>
          </div>
        </div>

        {/* AI Scene Summary */}
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/20 backdrop-blur-xl mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-100">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Qwen2.5-VL Scene Reasoning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">"{report.scene_summary}"</p>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-white mb-6">Inventory Breakdown</h2>

        <div className="grid gap-6">
          {Object.entries(report.inventory).map(([room, items]) => (
            <Card key={room} className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
              <CardHeader className="bg-black/20 pb-4">
                <CardTitle className="text-lg">{room}</CardTitle>
                <CardDescription>{items.length} unique objects detected</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-gray-400">Object Type</TableHead>
                      <TableHead className="text-center text-gray-400">Count</TableHead>
                      <TableHead className="text-gray-400">AI Confidence</TableHead>
                      <TableHead className="text-right text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="border-white/10 hover:bg-white/5 transition-colors">
                        <TableCell className="font-medium text-white">{item.class}</TableCell>
                        <TableCell className="text-center text-gray-300">{item.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${item.confidence}%` }} 
                              />
                            </div>
                            <span className="text-xs text-gray-400">{item.confidence}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === "Verified" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" /> {item.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" /> {item.status}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
