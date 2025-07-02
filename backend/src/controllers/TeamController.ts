import type { Response } from "express"
import bcrypt from "bcryptjs"
import Team from "../models/Team"
import User from "../models/User"
import { EmailService } from "../services/EmailService"
import type { AuthRequest } from "../middleware/auth"

// Generate random password
const generateTempPassword = (): string => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
}

export class TeamController {
  // @desc    Get team details
  static async getTeam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.user!

      if (!teamId) {
        res.status(404).json({ message: "No team found" })
        return
      }

      const team = await Team.findById(teamId).populate("members", "name email role avatar isActive")

      if (!team) {
        res.status(404).json({ message: "Team not found" })
        return
      }

      res.json({ team })
    } catch (error) {
      console.error("Get team error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }

  static async getTeamMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.user!

      if (!teamId) {
        res.status(400).json({ message: "User not part of any team" })
        return
      }

      const team = await Team.findById(teamId).populate("members.userId", "name email avatar")

      if (!team) {
        res.status(404).json({ message: "Team not found" })
        return
      }

      const members = team.members.map((member: any) => ({
        id: member.userId._id,
        email: member.userId.email,
        name: member.userId.name,
        avatar: member.userId.avatar,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
      }))

      res.json({ members })
    } catch (error) {
      console.error("Get team members error:", error)
      res.status(500).json({ message: "Internal server error" })
    }
  }

  // @desc    Invite team member
  static async inviteMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId, role: userRole } = req.user!
      const { email, role, name } = req.body

      // Validate input
      if (!email || !role || !name) {
        res.status(400).json({ message: "Email, role, and name are required" })
        return
      }

      if (!["creator", "editor", "manager"].includes(role)) {
        res.status(400).json({ message: "Invalid role" })
        return
      }

      // Check if user has permission to invite
      if (userRole !== "manager") {
        res.status(403).json({ message: "Only managers can invite team members" })
        return
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        res.status(400).json({ message: "User with this email already exists" })
        return
      }

      // Get team info
      const team = await Team.findById(teamId)
      if (!team) {
        res.status(404).json({ message: "Team not found" })
        return
      }

      // Get inviter info
      const inviter = await User.findById(req.user!.userId)
      if (!inviter) {
        res.status(404).json({ message: "Inviter not found" })
        return
      }

      // Generate temporary password
      const tempPassword = generateTempPassword()
      const hashedPassword = await bcrypt.hash(tempPassword, 12)

      // Create new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
        teamId,
        isActive: true,
      })

      await newUser.save()

      // Add user to team
      team.members.push(newUser._id)
      await team.save()

      // Send invitation email
      try {
        await EmailService.sendInvitation(email, {
          teamName: team.name,
          inviterName: inviter.name,
          role,
          tempPassword,
          loginUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login`,
        })
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError)
        // Don't fail the invitation if email fails
      }

      res.status(201).json({
        message: "Team member invited successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      })
    } catch (error) {
      console.error("Invite member error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }

  // @desc    Update team member role
  static async updateMemberRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId, role: userRole } = req.user!
      const { memberId } = req.params
      const { role } = req.body

      // Check permissions
      if (userRole !== "manager") {
        res.status(403).json({ message: "Only managers can update member roles" })
        return
      }

      if (!["creator", "editor", "manager"].includes(role)) {
        res.status(400).json({ message: "Invalid role" })
        return
      }

      // Update member
      const member = await User.findOneAndUpdate(
        { _id: memberId, teamId },
        { role },
        { new: true, select: "name email role avatar isActive" },
      )

      if (!member) {
        res.status(404).json({ message: "Team member not found" })
        return
      }

      res.json({
        message: "Member role updated successfully",
        member,
      })
    } catch (error) {
      console.error("Update member role error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }

  // @desc    Remove team member
  static async removeMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId, role: userRole } = req.user!
      const { memberId } = req.params

      // Check permissions
      if (userRole !== "manager") {
        res.status(403).json({ message: "Only managers can remove team members" })
        return
      }

      // Find and remove member
      const member = await User.findOneAndDelete({ _id: memberId, teamId })

      if (!member) {
        res.status(404).json({ message: "Team member not found" })
        return
      }

      // Remove from team
      await Team.findByIdAndUpdate(teamId, {
        $pull: { members: memberId },
      })

      res.json({ message: "Team member removed successfully" })
    } catch (error) {
      console.error("Remove member error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }

  // @desc    Get team stats
  static async getTeamStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.user!

      if (!teamId) {
        res.status(404).json({ message: "No team found" })
        return
      }

      // Get team member count by role
      const memberStats = await User.aggregate([
        { $match: { teamId: teamId, isActive: true } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ])

      // Get total video count (you'll need to implement this based on your Video model)
      // const videoCount = await Video.countDocuments({ teamId })

      const stats = {
        totalMembers: await User.countDocuments({ teamId, isActive: true }),
        membersByRole: memberStats.reduce(
          (acc, stat) => {
            acc[stat._id] = stat.count
            return acc
          },
          {} as Record<string, number>,
        ),
        // totalVideos: videoCount,
      }

      res.json({ stats })
    } catch (error) {
      console.error("Get team stats error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
}
