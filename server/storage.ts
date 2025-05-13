import { 
  Activity, 
  InsertActivity, 
  ProjectTag, 
  InsertProjectTag, 
  User, 
  InsertUser,
  activities,
  projectTags,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project tag methods
  getAllProjectTags(): Promise<ProjectTag[]>;
  getProjectTagByName(name: string): Promise<ProjectTag | undefined>;
  createProjectTag(tag: InsertProjectTag): Promise<ProjectTag>;

  // Activity methods
  getAllActivities(): Promise<Activity[]>;
  getActivityById(id: number): Promise<Activity | undefined>;
  getActivitiesByDate(date: string): Promise<Activity[]>;
  getActivitiesByDateRange(startDate: string, endDate: string): Promise<Activity[]>;
  getActivitiesByProjectTag(tagName: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users)
      .values(insertUser)
      .returning();
    
    return result[0];
  }

  // Project tag methods
  async getAllProjectTags(): Promise<ProjectTag[]> {
    return await db.select().from(projectTags);
  }

  async getProjectTagByName(name: string): Promise<ProjectTag | undefined> {
    const result = await db.select()
      .from(projectTags)
      .where(eq(projectTags.name, name))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async createProjectTag(insertTag: InsertProjectTag): Promise<ProjectTag> {
    // Check if tag already exists
    const existingTag = await this.getProjectTagByName(insertTag.name);
    if (existingTag) {
      return existingTag;
    }

    const result = await db.insert(projectTags)
      .values(insertTag)
      .returning();
    
    return result[0];
  }

  // Activity methods
  async getAllActivities(): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .orderBy(desc(activities.date), asc(activities.startTime));
  }

  async getActivityById(id: number): Promise<Activity | undefined> {
    const result = await db.select()
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : undefined;
  }

  async getActivitiesByDate(date: string): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.date, date))
      .orderBy(asc(activities.startTime));
  }

  async getActivitiesByDateRange(startDate: string, endDate: string): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(
        and(
          gte(activities.date, startDate),
          lte(activities.date, endDate)
        )
      )
      .orderBy(desc(activities.date), asc(activities.startTime));
  }

  async getActivitiesByProjectTag(tagName: string): Promise<Activity[]> {
    // We need a query that checks if the tagName is in the array
    // Since this requires custom SQL, we'll load all activities and filter
    const allActivities = await this.getAllActivities();
    return allActivities.filter(activity => 
      activity.projectTags.includes(tagName)
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    // Create any new project tags
    for (const tagName of insertActivity.projectTags) {
      await this.createProjectTag({ name: tagName });
    }
    
    const result = await db.insert(activities)
      .values({
        ...insertActivity,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async updateActivity(id: number, activityUpdate: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = await this.getActivityById(id);
    if (!activity) {
      return undefined;
    }

    // Create any new project tags
    if (activityUpdate.projectTags) {
      for (const tagName of activityUpdate.projectTags) {
        await this.createProjectTag({ name: tagName });
      }
    }
    
    const result = await db.update(activities)
      .set(activityUpdate)
      .where(eq(activities.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities)
      .where(eq(activities.id, id))
      .returning({ id: activities.id });
    
    return result.length > 0;
  }

  // Initialize default project tags
  async initializeDefaultTags(): Promise<void> {
    const defaultTags = [
      "Website Redesign",
      "Client Meeting",
      "Documentation",
      "Research",
      "Development"
    ];

    for (const tag of defaultTags) {
      await this.createProjectTag({ name: tag });
    }
  }
}

// Initialize the database storage and default tags
export const storage = new DatabaseStorage();

// Initialize default tags in the background
(async () => {
  try {
    await (storage as DatabaseStorage).initializeDefaultTags();
    console.log("Default project tags initialized");
  } catch (error) {
    console.error("Error initializing default project tags:", error);
  }
})();
