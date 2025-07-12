import type { Request, Response, NextFunction } from "express";
import { AuthController } from "../controllers/AuthController";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    teamId?: string;
  };
  body: Request["body"];
  params: Request["params"];
  query: Request["query"];
  cookies: Request["cookies"];
  headers: Request["headers"];
  file?: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
  };
  files?: Record<string, unknown>;
  resourceType?: "video" | "image";
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Debug logging
    console.log("Auth middleware - Cookies:", req.cookies);
    console.log("Auth middleware - Headers:", req.headers);
    console.log("Auth middleware - Origin:", req.headers.origin);

    // Try to get token from cookie first, then fallback to Authorization header
    let token = req.cookies["auth-token"];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (
        authHeader &&
        typeof authHeader === "string" &&
        authHeader.startsWith("Bearer ")
      ) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      console.log("Auth middleware - No token found");
      res.status(401).json({ message: "Authorization token required" });
      return;
    }

    const user = await AuthController.verifyToken(token);

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId?.toString(),
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
};
