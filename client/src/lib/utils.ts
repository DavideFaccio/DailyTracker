import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format minutes to readable time
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return `${hours}h ${mins}m`;
}

// Calculate time difference in minutes
export function timeDifferenceInMinutes(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  let totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  
  // Handle overnight activities (end time is earlier than start time)
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Add a full day in minutes
  }
  
  return totalMinutes;
}

// Calculate end time based on start time and duration
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

// Format time to display in 12-hour format
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Group activities by date for display
export function groupActivitiesByDate(activities: any[]) {
  const grouped = new Map<string, any[]>();
  
  for (const activity of activities) {
    if (!grouped.has(activity.date)) {
      grouped.set(activity.date, []);
    }
    grouped.get(activity.date)!.push(activity);
  }
  
  // Convert to array of { date, activities } objects
  return Array.from(grouped.entries())
    .map(([date, activities]) => ({ date, activities }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date (newest first)
}

// Format date for display
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateStr === today.toISOString().split('T')[0]) {
    return 'Today';
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Get current time in HH:MM format
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Get date range for filtering
export function getDateRange(filter: string): { startDate: string, endDate: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStr = today.toISOString().split('T')[0];
  
  if (filter === 'today') {
    return { startDate: todayStr, endDate: todayStr };
  }
  
  if (filter === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    return { startDate: yesterdayStr, endDate: yesterdayStr };
  }
  
  if (filter === 'thisWeek') {
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    return { 
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: todayStr
    };
  }
  
  if (filter === 'lastWeek') {
    const endOfLastWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
    
    const startOfLastWeek = new Date(endOfLastWeek);
    startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
    
    return { 
      startDate: startOfLastWeek.toISOString().split('T')[0],
      endDate: endOfLastWeek.toISOString().split('T')[0]
    };
  }
  
  if (filter === 'thisMonth') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return { 
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: todayStr
    };
  }
  
  // Default to all time (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  return { 
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: todayStr
  };
}
