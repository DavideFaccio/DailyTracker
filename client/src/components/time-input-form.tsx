import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTodayDate, getCurrentTime, timeDifferenceInMinutes } from "@/lib/utils";
import { activityInputSchema } from "@shared/schema";

import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ProjectTagSelector from "./project-tag-selector";

interface TimeInputFormProps {
  onSuccess?: () => void;
}

export default function TimeInputForm({ onSuccess }: TimeInputFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<"startStop" | "duration">("startStop");

  // Define form with zod resolver
  const form = useForm<z.infer<typeof activityInputSchema>>({
    resolver: zodResolver(activityInputSchema),
    defaultValues: {
      description: "",
      date: getTodayDate(),
      startTime: getCurrentTime(),
      endTime: "",
      durationMinutes: 0,
      projectTags: [],
      inputMethod: "startStop",
    },
  });

  // Create activity mutation
  const createActivity = useMutation({
    mutationFn: async (data: any) => {
      // Calculate duration minutes if using start/stop method
      let activityData = { ...data };
      
      if (data.inputMethod === "startStop") {
        activityData.durationMinutes = timeDifferenceInMinutes(data.startTime, data.endTime);
      }

      // Remove inputMethod as it's not needed in the backend
      const { inputMethod, ...finalData } = activityData;
      
      const response = await apiRequest("POST", "/api/activities", finalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Activity logged successfully",
        description: "Your activity has been recorded.",
      });
      
      // Reset form
      form.reset({
        description: "",
        date: getTodayDate(),
        startTime: getCurrentTime(),
        endTime: "",
        durationMinutes: 0,
        projectTags: [],
        inputMethod: activeTab,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to log activity",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    const tabValue = value as "startStop" | "duration";
    setActiveTab(tabValue);
    
    form.setValue("inputMethod", tabValue);
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof activityInputSchema>) => {
    await createActivity.mutate(data);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Log Activity</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What are you working on?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Time Tracking Tabs */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Time Tracking</h3>
              
              <Tabs defaultValue="startStop" value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="startStop">Start/Stop</TabsTrigger>
                  <TabsTrigger value="duration">Duration</TabsTrigger>
                </TabsList>
                
                {/* Start/Stop Time Inputs */}
                <TabsContent value="startStop" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Duration Based Inputs */}
                <TabsContent value="duration" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Project Tags Field */}
            <FormField
              control={form.control}
              name="projectTags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Tags</FormLabel>
                  <FormControl>
                    <ProjectTagSelector 
                      selectedTags={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={createActivity.isPending}
            >
              {createActivity.isPending ? "Logging..." : "Log Activity"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
