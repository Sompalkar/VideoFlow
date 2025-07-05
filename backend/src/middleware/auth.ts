import type { Request, Response, NextFunction } from "express";
import { AuthController } from "../controllers/AuthController";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    teamId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from cookie first, then fallback to Authorization header
    let token = req.cookies["auth-token"];

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
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
