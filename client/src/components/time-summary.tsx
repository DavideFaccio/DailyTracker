import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatMinutes } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface SummaryData {
  today: {
    totalTime: string;
    totalMinutes: number;
    comparedToYesterday: number;
  };
  week: {
    totalTime: string;
    totalMinutes: number;
    target: string;
    progress: number;
  };
  topProject: {
    name: string;
    time: string;
    percentage: number;
  };
}

export default function TimeSummary() {
  // Fetch summary data
  const { data, isLoading } = useQuery<SummaryData>({
    queryKey: ["/api/summary"],
  });
  
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const { today, week, topProject } = data;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Today Summary */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Today</h3>
          <p className="text-2xl font-semibold text-slate-800">{today.totalTime}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span className="inline-flex items-center">
              {today.comparedToYesterday > 0 ? (
                <>
                  <ArrowUpIcon className="h-3 w-3 text-emerald-500 mr-1" />
                  <span className="text-emerald-500">{Math.abs(today.comparedToYesterday)}% more</span>
                </>
              ) : today.comparedToYesterday < 0 ? (
                <>
                  <ArrowDownIcon className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-500">{Math.abs(today.comparedToYesterday)}% less</span>
                </>
              ) : (
                <span>Same as</span>
              )}
              {" than yesterday"}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* This Week Summary */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-1">This Week</h3>
          <p className="text-2xl font-semibold text-slate-800">{week.totalTime}</p>
          <div className="mt-2 text-xs text-slate-500">
            <Progress value={week.progress} className="h-1.5 mb-1" />
            <span>{week.progress}% of {week.target} target</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Project Summary */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Top Project</h3>
          <p className="text-xl font-semibold text-slate-800 truncate">{topProject.name}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span>{topProject.time}</span>{" "}
            this week ({topProject.percentage}%)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
