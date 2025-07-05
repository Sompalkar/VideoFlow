import type { Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import Team from "../models/Team";
import User from "../models/User";
import { EmailService } from "../services/EmailService";
import type { AuthRequest } from "../middleware/auth";
import { cloudasset } from "googleapis/build/src/apis/cloudasset";

export class TeamController {
  // @desc    Get team members (renamed from getTeam to match route)
  static async getTeamMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId).populate(
        "members.userId",
        "name email avatar"
      );

      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      res.json({ team });
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Get team details
  static async getTeam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId).populate(
        "members.userId",
        "name email avatar"
      );

      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      res.json({ team });
    } catch (error) {
      console.error("Get team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Invite team member
  /**
   * Invite a new member to the team
   * Only creators and managers can invite new members
   */
  static async inviteMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Validate request data
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res
          .status(400)
          .json({ message: "Validation errors", errors: errors.array() });
        return;
      }

      const { userId } = req.user!;
      const { email, role } = req.body;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      // Check if user has permission to invite
      // Note: userId from JWT is ObjectId, but team members store userId as string
      // So we convert both to strings for comparison
      const userMember = team.members.find(
        (m) => m.userId.toString() === userId.toString()
      );

      // Auto-promote single editor members to creator
      if (team.members.length === 1 && userMember?.role === "editor") {
        userMember.role = "creator";
        await team.save();
      }

      // Verify user has permission to invite (creator or manager)
      if (!userMember || !["creator", "manager"].includes(userMember.role)) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
      }

      // Check if user already exists in the system
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Check if already a team member
        const isAlreadyMember = team.members.some(
          (m) => m.userId.toString() === existingUser._id.toString()
        );
        if (isAlreadyMember) {
          res.status(400).json({ message: "User is already a team member" });
          return;
        }

        // Add existing user to team
        team.members.push({
          userId: existingUser._id,
          role,
          status: "active",
          joinedAt: new Date(),
        });

        existingUser.teamId = team._id;
        await existingUser.save();
        await team.save();

        // Send notification email using the correct method name
        try {
          await EmailService.sendInvitation(email, {
            teamName: team.name,
            inviterName: user.name,
            role,
            tempPassword: "Please use your existing password",
            loginUrl: `${process.env.FRONTEND_URL}/auth/login`,
          });
        } catch (emailError) {
          console.log(
            "Email sending failed, but user was added to team:",
            emailError
          );
          // Continue even if email fails
        }
      } else {
        // Create new user with temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create new user with "editor" role (valid enum value)
        // The team member role can be different from the user's individual role
        const newUser = new User({
          email,
          password: hashedPassword,
          name: email.split("@")[0],
          role: "editor", // Default individual role for new team members
          teamId: team._id,
          isActive: true, // Allow immediate login for invited team members
          needsPasswordChange: true, // Require password change on first login
        });

        await newUser.save();

        // Add to team
        team.members.push({
          userId: newUser._id,
          role,
          status: "pending",
          joinedAt: new Date(),
        });

        await team.save();

        // Send invitation email with temporary password
        try {
          await EmailService.sendInvitation(email, {
            teamName: team.name,
            inviterName: user.name,
            role,
            tempPassword,
            loginUrl: `${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/auth/login`,
          });
        } catch (emailError) {
          console.log(
            "Email sending failed, but user was created and added to team:",
            emailError
          );
          // Continue even if email fails
        }
      }

      res.json({ message: "Invitation sent successfully" });
    } catch (error) {
      console.error("Invite member error:", error);

      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes("validation failed")) {
          res.status(400).json({ message: "Invalid data provided" });
          return;
        }
        if (error.message.includes("duplicate key")) {
          res
            .status(400)
            .json({ message: "User already exists with this email" });
          return;
        }
      }

      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Update team member role
  static async updateMemberRole(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.user!;
      const { memberId } = req.params;
      const { role } = req.body;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      // Check permissions
      const userMember = team.members.find(
        (m) => m.userId.toString() === userId.toString()
      );
      if (!userMember || userMember.role !== "creator") {
        res
          .status(403)
          .json({ message: "Only team creators can update member roles" });
        return;
      }

      // Find and update member
      const memberIndex = team.members.findIndex(
        (m) => m.userId.toString() === memberId
      );
      if (memberIndex === -1) {
        res.status(404).json({ message: "Member not found" });
        return;
      }

      team.members[memberIndex].role = role;
      await team.save();

      res.json({ message: "Member role updated successfully" });
    } catch (error) {
      console.error("Update member role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Remove team member
  static async removeMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { memberId } = req.params;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      // Check permissions
      const userMember = team.members.find(
        (m) => m.userId.toString() === userId.toString()
      );
      if (!userMember || !["creator", "manager"].includes(userMember.role)) {
        res.status(403).json({ message: "Insufficient permissions" });
        return;
      }

      // Can't remove creator
      const memberToRemove = team.members.find(
        (m) => m.userId.toString() === memberId
      );
      if (memberToRemove?.role === "creator") {
        res.status(400).json({ message: "Cannot remove team creator" });
        return;
      }

      // Remove member from team
      team.members = team.members.filter(
        (m) => m.userId.toString() !== memberId
      );
      await team.save();

      // Remove team reference from user
      await User.findByIdAndUpdate(memberId, { $unset: { teamId: 1 } });

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Remove member error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Update team details
  static async updateTeam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;
      const { name, description } = req.body;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      // Check permissions
      const userMember = team.members.find(
        (m) => m.userId.toString() === userId.toString()
      );
      if (!userMember || userMember.role !== "creator") {
        res
          .status(403)
          .json({ message: "Only team creators can update team details" });
        return;
      }

      team.name = name || team.name;
      team.description = description || team.description;
      await team.save();

      res.json({ team });
    } catch (error) {
      console.error("Update team error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Get team stats
  static async getTeamStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      const stats = {
        totalMembers: team.members.length,
        activeMembers: team.members.filter((m) => m.status === "active").length,
        pendingMembers: team.members.filter((m) => m.status === "pending")
          .length,
        roleDistribution: {
          creator: team.members.filter((m) => m.role === "creator").length,
          manager: team.members.filter((m) => m.role === "manager").length,
          editor: team.members.filter((m) => m.role === "editor").length,
        },
      };

      res.json({ stats });
    } catch (error) {
      console.error("Get team stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // @desc    Promote user to creator if they're the only team member
  static async promoteToCreator(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { userId } = req.user!;

      const user = await User.findById(userId);
      if (!user?.teamId) {
        res.status(404).json({ message: "No team found" });
        return;
      }

      const team = await Team.findById(user.teamId);
      if (!team) {
        res.status(404).json({ message: "Team not found" });
        return;
      }

      // Check if user is the only member
      if (team.members.length !== 1) {
        res
          .status(400)
          .json({ message: "Can only promote if you're the only team member" });
        return;
      }

      const userMember = team.members.find(
        (m) => m.userId.toString() === userId.toString()
      );
      if (!userMember) {
        res.status(404).json({ message: "User not found in team" });
        return;
      }

      // Promote to creator
      userMember.role = "creator";
      await team.save();

      // Update user's individual role as well
      user.role = "creator";
      await user.save();

      res.json({
        message: "Successfully promoted to creator",
        role: "creator",
      });
    } catch (error) {
      console.error("Promote to creator error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
