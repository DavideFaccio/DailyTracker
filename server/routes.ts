import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertActivitySchema, 
  insertProjectTagSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`);
    next();
  });

  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ 
        message: validationError.message,
        errors: err.errors
      });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  };

  // Project Tags routes
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllProjectTags();
      res.json(projects);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const validatedData = insertProjectTagSchema.parse(req.body);
      const project = await storage.createProjectTag(validatedData);
      res.status(201).json(project);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Activities routes
  app.get('/api/activities', async (req, res) => {
    try {
      const { date, startDate, endDate, projectTag } = req.query;
      
      let activities;
      
      if (projectTag && typeof projectTag === 'string') {
        activities = await storage.getActivitiesByProjectTag(projectTag);
      } else if (date && typeof date === 'string') {
        activities = await storage.getActivitiesByDate(date);
      } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
        activities = await storage.getActivitiesByDateRange(startDate, endDate);
      } else {
        activities = await storage.getAllActivities();
      }
      
      res.json(activities);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get('/api/activities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      
      const activity = await storage.getActivityById(id);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post('/api/activities', async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.put('/api/activities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      
      // Validate the input data (partial validation)
      const updateData = req.body;
      
      const updatedActivity = await storage.updateActivity(id, updateData);
      if (!updatedActivity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(updatedActivity);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete('/api/activities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      
      const success = await storage.deleteActivity(id);
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Summary routes
  app.get('/api/summary', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Get week range (Sunday to Saturday)
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      
      // Fetch activities for summary
      const todayActivities = await storage.getActivitiesByDate(today);
      const yesterdayActivities = await storage.getActivitiesByDate(yesterday);
      const weekActivities = await storage.getActivitiesByDateRange(startOfWeekStr, endOfWeekStr);
      
      // Calculate today's total minutes
      const todayMinutes = todayActivities.reduce((sum, activity) => sum + activity.durationMinutes, 0);
      
      // Calculate yesterday's total minutes
      const yesterdayMinutes = yesterdayActivities.reduce((sum, activity) => sum + activity.durationMinutes, 0);
      
      // Calculate this week's total minutes
      const weekMinutes = weekActivities.reduce((sum, activity) => sum + activity.durationMinutes, 0);
      
      // Calculate weekly target progress (assuming 24 hours or 1440 minutes)
      const weekTargetMinutes = 1440; // 24 hours
      const weekProgress = Math.min(Math.round((weekMinutes / weekTargetMinutes) * 100), 100);
      
      // Find top project for the week
      const projectMinutes = new Map<string, number>();
      
      for (const activity of weekActivities) {
        for (const tag of activity.projectTags) {
          const minutes = projectMinutes.get(tag) || 0;
          projectMinutes.set(tag, minutes + activity.durationMinutes);
        }
      }
      
      let topProject = { name: "None", minutes: 0, percentage: 0 };
      
      if (projectMinutes.size > 0) {
        let maxMinutes = 0;
        let maxProject = "";
        
        for (const [project, minutes] of projectMinutes.entries()) {
          if (minutes > maxMinutes) {
            maxMinutes = minutes;
            maxProject = project;
          }
        }
        
        const percentage = weekMinutes > 0 ? Math.round((maxMinutes / weekMinutes) * 100) : 0;
        
        topProject = {
          name: maxProject,
          minutes: maxMinutes,
          percentage
        };
      }
      
      // Format time values (convert minutes to hours and minutes)
      const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
      };
      
      const summary = {
        today: {
          totalTime: formatTime(todayMinutes),
          totalMinutes: todayMinutes,
          comparedToYesterday: yesterdayMinutes > 0 
            ? Math.round((todayMinutes - yesterdayMinutes) / yesterdayMinutes * 100) 
            : 0
        },
        week: {
          totalTime: formatTime(weekMinutes),
          totalMinutes: weekMinutes,
          target: formatTime(weekTargetMinutes),
          progress: weekProgress
        },
        topProject: {
          name: topProject.name,
          time: formatTime(topProject.minutes),
          percentage: topProject.percentage
        }
      };
      
      res.json(summary);
    } catch (err) {
      handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
