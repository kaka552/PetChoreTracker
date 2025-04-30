import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertModelSchema } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// JWT secret key for auth - in production, this would be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "ar-app-secret-key";

// Authentication middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Dev role middleware
const checkDevRole = (req: any, res: any, next: any) => {
  if (req.user.role !== 'dev') {
    return res.status(403).json({ message: "Developer access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      // Return user data without password and token
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      
      // Return user data without password and token
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Model routes
  // Get all models
  app.get("/api/models", authenticate, async (req, res) => {
    try {
      const models = await storage.getAllModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get a specific model
  app.get("/api/models/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      res.json(model);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Create a model (dev only)
  app.post("/api/models", authenticate, checkDevRole, async (req, res) => {
    try {
      const modelData = insertModelSchema.parse({
        ...req.body,
        uploaded_by: req.user.id
      });
      
      const model = await storage.createModel(modelData);
      res.status(201).json(model);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update a model (dev only)
  app.put("/api/models/:id", authenticate, checkDevRole, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      // Check if model exists
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Check if user owns the model
      if (model.uploaded_by !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this model" });
      }
      
      // Update model
      const updatedModel = await storage.updateModel(id, req.body);
      res.json(updatedModel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete a model (dev only)
  app.delete("/api/models/:id", authenticate, checkDevRole, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id);
      
      // Check if model exists
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      // Check if user owns the model
      if (model.uploaded_by !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this model" });
      }
      
      // Delete model
      await storage.deleteModel(id);
      res.json({ message: "Model deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
