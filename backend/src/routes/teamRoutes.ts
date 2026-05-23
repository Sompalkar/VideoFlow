import { Router } from "express";
import { TeamController } from "../controllers/TeamController";
import { authenticate, authorize } from "../middleware/auth";
import { validateTeamInvite } from "../middleware/validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/team
// @desc    Get team details and members
// @access  Private
router.get("/", TeamController.getTeamMembers);

// @route   GET /api/team/stats
// @desc    Get team statistics
// @access  Private
router.get("/stats", TeamController.getTeamStats);

// @route   POST /api/team/invite
// @desc    Invite a new team member
// @access  Private
router.post("/invite", validateTeamInvite, TeamController.inviteMember);

// @route   PUT /api/team/members/:memberId/role
// @desc    Update team member role
// @access  Private
router.put("/members/:memberId/role", TeamController.updateMemberRole);

// @route   DELETE /api/team/members/:memberId
// @desc    Remove team member
// @access  Private
router.delete("/members/:memberId", TeamController.removeMember);

// @route   PUT /api/team
// @desc    Update team details
// @access  Private
router.put("/", TeamController.updateTeam);

// @route   POST /api/team/promote
// @desc    Promote user to creator if they're the only team member
// @access  Private
router.post("/promote", TeamController.promoteToCreator);

export default router;
