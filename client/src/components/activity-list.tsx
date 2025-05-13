import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Activity, ProjectTag } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatMinutes, formatTime, groupActivitiesByDate, formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClockIcon, Calendar, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";

interface ActivityListProps {
  onEditActivity?: (activity: Activity) => void;
}

export default function ActivityList({ onEditActivity }: ActivityListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedActivityId, setExpandedActivityId] = React.useState<number | null>(null);
  const [projectFilter, setProjectFilter] = React.useState<string>("");
  const [dateFilter, setDateFilter] = React.useState<string>("today");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [activityToDelete, setActivityToDelete] = React.useState<number | null>(null);
  
  // Fetch all project tags
  const { data: projectTags = [] } = useQuery<ProjectTag[]>({
    queryKey: ["/api/projects"],
  });
  
  // Fetch activities with filters
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activities", projectFilter, dateFilter],
    queryFn: async ({ queryKey }) => {
      const [_, projectTag, dateRange] = queryKey;
      let url = "/api/activities";
      
      const params = new URLSearchParams();
      
      if (projectTag && projectTag !== "all") {
        params.append("projectTag", projectTag as string);
      }
      
      if (dateRange === "today") {
        const today = new Date().toISOString().split("T")[0];
        params.append("date", today);
      } else if (dateRange === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        params.append("date", yesterdayStr);
      } else if (dateRange === "thisWeek") {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
        const todayStr = today.toISOString().split("T")[0];
        
        params.append("startDate", startOfWeekStr);
        params.append("endDate", todayStr);
      } else if (dateRange === "lastWeek") {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const endOfLastWeek = new Date(today);
        endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
        const startOfLastWeek = new Date(endOfLastWeek);
        startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
        
        params.append("startDate", startOfLastWeek.toISOString().split("T")[0]);
        params.append("endDate", endOfLastWeek.toISOString().split("T")[0]);
      } else if (dateRange === "thisMonth") {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        params.append("startDate", startOfMonth.toISOString().split("T")[0]);
        params.append("endDate", today.toISOString().split("T")[0]);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      
      return response.json();
    },
  });
  
  // Delete activity mutation
  const deleteActivity = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/activities/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Activity deleted",
        description: "The activity has been deleted successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete activity",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Toggle activity details
  const toggleActivityDetails = (id: number) => {
    setExpandedActivityId(expandedActivityId === id ? null : id);
  };
  
  // Handle delete button click
  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivityToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete activity
  const confirmDelete = async () => {
    if (activityToDelete !== null) {
      await deleteActivity.mutate(activityToDelete);
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (activity: Activity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditActivity) {
      onEditActivity(activity);
    }
  };
  
  // Group activities by date
  const groupedActivities = React.useMemo(() => {
    return groupActivitiesByDate(activities);
  }, [activities]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <Skeleton className="h-6 w-36" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-24 w-full rounded-lg mb-3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Activity Log Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-lg font-semibold mb-2 sm:mb-0">Activity Log</h2>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectTags.map((tag: ProjectTag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Activity List */}
        <div className="space-y-4">
          {groupedActivities.length > 0 ? (
            groupedActivities.map(({ date, activities }) => (
              <React.Fragment key={date}>
                {/* Date Header */}
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-medium text-slate-500">{formatDate(date)}</h3>
                </div>
                
                {/* Activities for this date */}
                {activities.map((activity) => (
                  <Collapsible
                    key={activity.id}
                    open={expandedActivityId === activity.id}
                    onOpenChange={() => toggleActivityDetails(activity.id)}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 cursor-pointer text-left">
                        <div className="mb-2 sm:mb-0">
                          <h3 className="font-medium text-slate-800">{activity.description}</h3>
                          <div className="flex items-center text-sm text-slate-500 mt-1">
                            <span className="inline-flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {formatTime(activity.startTime)} - {activity.endTime ? formatTime(activity.endTime) : ""}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{formatMinutes(activity.durationMinutes)}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="flex flex-wrap gap-1 mr-4">
                            {activity.projectTags.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="bg-primary/10 text-primary text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {activity.projectTags.length > 2 && (
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">
                                +{activity.projectTags.length - 2}
                              </Badge>
                            )}
                          </div>
                          {expandedActivityId === activity.id ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-t border-slate-200 p-4 bg-slate-50">
                      <p className="text-sm text-slate-600 mb-3">
                        {activity.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {activity.projectTags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-primary/10 text-primary text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mb-4">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex justify-end mt-3 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-slate-600 hover:text-slate-800"
                          onClick={(e) => handleEditClick(activity, e)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={(e) => handleDeleteClick(activity.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </React.Fragment>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 rounded-full p-4 mb-4">
                <ClockIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-1">No activities logged yet</h3>
              <p className="text-sm text-slate-500 mb-4">Start tracking your time by logging your first activity.</p>
            </div>
          )}
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Activity</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this activity? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
