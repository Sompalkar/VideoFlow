import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User";
import Team from "../models/Team";
import type { AuthRequest } from "../middleware/auth";

// Get JWT secret dynamically
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res
          .status(400)
          .json({ message: "Validation errors", errors: errors.array() });
        return;
      }

      const { email, password, name, role = "creator" } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res
          .status(400)
          .json({ message: "User already exists with this email" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        role,
      });

      await user.save();

      // If user is a creator, create a team
      if (user.role === "creator") {
        const team = new Team({
          name: `${user.name}'s Team`,
          ownerId: user._id,
          members: [
            {
              userId: user._id,
              role: "creator",
              status: "active",
            },
          ],
          subscription: {
            plan: "starter",
            status: "active",
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

        await team.save();
        user.teamId = team._id;
        await user.save();
      }

      // Get team member role if user has a team
      let teamMemberRole = user.role; // fallback to individual role
      if (user.teamId) {
        const team = await Team.findById(user.teamId);
        if (team) {
          const teamMember = team.members.find(
            (m) => m.userId.toString() === user._id.toString()
          );
          if (teamMember) {
            teamMemberRole = teamMember.role;
          }
        }
      }

      // Generate JWT token with team member role
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: teamMemberRole },
        getJWTSecret(),
        { expiresIn: "30d" }
      );

      // Set HTTP-only cookie
      console.log("Setting auth cookie with options:", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
          needsPasswordChange: user.needsPasswordChange,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res
          .status(400)
          .json({ message: "Validation errors", errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Get team member role if user has a team
      let teamMemberRole = user.role; // fallback to individual role
      if (user.teamId) {
        const team = await Team.findById(user.teamId);
        if (team) {
          const teamMember = team.members.find(
            (m) => m.userId.toString() === user._id.toString()
          );
          if (teamMember) {
            teamMemberRole = teamMember.role;
          }
        }
      }

      // Generate JWT token with team member role
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: teamMemberRole },
        getJWTSecret(),
        { expiresIn: "30d" }
      );

      // Set HTTP-only cookie
      console.log("Setting auth cookie with options:", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
          needsPasswordChange: user.needsPasswordChange,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, getJWTSecret()) as any;
      const user = await User.findById(decoded.userId).select("-password");

      if (!user || !user.isActive) {
        throw new Error("Invalid token");
      }

      // Get team member role if user has a team
      let teamMemberRole = user.role; // fallback to individual role
      if (user.teamId) {
        const team = await Team.findById(user.teamId);
        if (team) {
          const teamMember = team.members.find(
            (m) => m.userId.toString() === user._id.toString()
          );
          if (teamMember) {
            teamMemberRole = teamMember.role;
          }
        }
      }

      return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: teamMemberRole, // Use team member role instead of individual role
        avatar: user.avatar,
        youtubeConnected: !!user.youtubeTokens,
        teamId: user.teamId,
        needsPasswordChange: user.needsPasswordChange,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { name, avatar } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { name, avatar } },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
          needsPasswordChange: user.needsPasswordChange,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Get team member role if user has a team
      let teamMemberRole = user.role; // fallback to individual role
      if (user.teamId) {
        const team = await Team.findById(user.teamId);
        if (team) {
          const teamMember = team.members.find(
            (m) => m.userId.toString() === user._id.toString()
          );
          if (teamMember) {
            teamMemberRole = teamMember.role;
          }
        }
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: teamMemberRole, // Return team member role
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
          needsPasswordChange: user.needsPasswordChange,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Change password
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        res
          .status(400)
          .json({ message: "Current password and new password are required" });
        return;
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        res
          .status(400)
          .json({ message: "New password must be at least 6 characters long" });
        return;
      }

      // Find user with password
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear needsPasswordChange flag
      user.password = hashedNewPassword;
      user.needsPasswordChange = false;
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear the auth cookie
      res.clearCookie("auth-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
