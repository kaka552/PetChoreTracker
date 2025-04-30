import { users, models, type User, type InsertUser, type Model, type InsertModel } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface for users and models
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Model operations
  getModel(id: number): Promise<Model | undefined>;
  getAllModels(): Promise<Model[]>;
  getUserModels(userId: number): Promise<Model[]>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, model: Partial<InsertModel>): Promise<Model | undefined>;
  deleteModel(id: number): Promise<boolean>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Model operations
  async getModel(id: number): Promise<Model | undefined> {
    const results = await db.select().from(models).where(eq(models.id, id));
    return results[0];
  }

  async getAllModels(): Promise<Model[]> {
    return await db.select().from(models);
  }

  async getUserModels(userId: number): Promise<Model[]> {
    return await db.select().from(models).where(eq(models.uploaded_by, userId));
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const result = await db.insert(models).values(insertModel).returning();
    return result[0];
  }

  async updateModel(id: number, modelUpdate: Partial<InsertModel>): Promise<Model | undefined> {
    // First check if the model exists
    const existingModel = await this.getModel(id);
    if (!existingModel) return undefined;

    // Update the model
    const result = await db
      .update(models)
      .set(modelUpdate)
      .where(eq(models.id, id))
      .returning();
    
    return result[0];
  }

  async deleteModel(id: number): Promise<boolean> {
    const result = await db
      .delete(models)
      .where(eq(models.id, id))
      .returning({ id: models.id });
    
    return result.length > 0;
  }
}

// Export the database storage instance
export const storage = new DatabaseStorage();
