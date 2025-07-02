import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import User from "../models/User"
import Team from "../models/Team"
import type { AuthRequest } from "../middleware/auth"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export class AuthController {

  static async register(req: Request, res: Response): Promise<void> {
    
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ message: "Validation errors", errors: errors.array() })
        return
      }

      const { email, password, name, role = "creator" } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(400).json({ message: "User already exists with this email" })
        return
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
        role,
      })

      await user.save()

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
        })

        await team.save()
        user.teamId = team._id
        await user.save()
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
        },
        token,
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        res.status(400).json({ message: "Validation errors", errors: errors.array() })
        return
      }

      const { email, password } = req.body

      // Find user
      const user = await User.findOne({ email, isActive: true })
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" })
        return
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        res.status(401).json({ message: "Invalid email or password" })
        return
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
        },
        token,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const user = await User.findById(decoded.userId).select("-password")

      if (!user || !user.isActive) {
        throw new Error("Invalid token")
      }

      return {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        youtubeConnected: !!user.youtubeTokens,
        teamId: user.teamId,
      }
    } catch (error) {
      throw new Error("Invalid token")
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!
      const { name, avatar } = req.body

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { name, avatar } },
        { new: true, runValidators: true },
      ).select("-password")

      if (!user) {
        res.status(404).json({ message: "User not found" })
        return
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
        },
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!

      const user = await User.findById(userId).select("-password")
      if (!user) {
        res.status(404).json({ message: "User not found" })
        return
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          youtubeConnected: !!user.youtubeTokens,
        },
      })
    } catch (error) {
      console.error("Get profile error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }
}
