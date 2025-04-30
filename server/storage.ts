import { users, models, type User, type InsertUser, type Model, type InsertModel } from "@shared/schema";

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

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private models: Map<number, Model>;
  private userIdCounter: number;
  private modelIdCounter: number;

  constructor() {
    this.users = new Map();
    this.models = new Map();
    this.userIdCounter = 1;
    this.modelIdCounter = 1;

    // Add a dev user by default
    this.createUser({
      email: "kakateja52@gmail.com", // As specified in the requirements
      password: "adminpass123", // This would typically be hashed
      role: "dev"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Model operations
  async getModel(id: number): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async getAllModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }

  async getUserModels(userId: number): Promise<Model[]> {
    return Array.from(this.models.values()).filter(
      (model) => model.uploaded_by === userId
    );
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = this.modelIdCounter++;
    const now = new Date();
    const model: Model = { 
      ...insertModel, 
      id,
      created_at: now
    };
    this.models.set(id, model);
    return model;
  }

  async updateModel(id: number, modelUpdate: Partial<InsertModel>): Promise<Model | undefined> {
    const existingModel = this.models.get(id);
    if (!existingModel) return undefined;

    const updatedModel: Model = { ...existingModel, ...modelUpdate };
    this.models.set(id, updatedModel);
    return updatedModel;
  }

  async deleteModel(id: number): Promise<boolean> {
    return this.models.delete(id);
  }
}

export const storage = new MemStorage();
