import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";

import TimeInputForm from "@/components/time-input-form";
import ActivityList from "@/components/activity-list";
import TimeSummary from "@/components/time-summary";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock } from "lucide-react";

export default function Home() {
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [activityToEdit, setActivityToEdit] = React.useState<Activity | null>(null);
  
  // Handle edit activity
  const handleEditActivity = (activity: Activity) => {
    setActivityToEdit(activity);
    setEditDialogOpen(true);
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    setEditDialogOpen(false);
    setActivityToEdit(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="text-primary text-2xl" />
            <h1 className="text-xl font-semibold text-primary">TimeTrack</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-500">Welcome, <span className="font-medium text-slate-700">User</span></span>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Activity Input Form */}
          <div className="col-span-1 mb-8 lg:mb-0">
            <TimeInputForm />
          </div>
          
          {/* Activity Log */}
          <div className="col-span-2">
            {/* Time Summary Cards */}
            <TimeSummary />
            
            {/* Activities List */}
            <ActivityList onEditActivity={handleEditActivity} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} TimeTrack. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Help</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Edit Activity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {activityToEdit && (
            <TimeInputForm onSuccess={handleFormSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
