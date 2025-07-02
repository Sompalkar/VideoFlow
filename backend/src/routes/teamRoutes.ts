import { Router } from "express"
// import { TeamController } from "@/controllers/TeamController"
import { TeamController } from "../controllers/TeamController"
// import { authenticate, authorize } from "@/middleware/auth"
import { authenticate,authorize } from "../middleware/auth"
// import { validateTeamInvite } from "@/middleware/validation"
import { validateTeamInvite } from "../middleware/validation"

const router = Router()

// @route   GET /api/team
// @desc    Get team members
// @access  Private
router.get("/", authenticate, TeamController.getTeamMembers)

// @route   POST /api/team/invite
// @desc    Invite a new team member
// @access  Private (Creator only)
router.post("/invite", authenticate, authorize(["creator"]), validateTeamInvite, TeamController.inviteMember)

// @route   PUT /api/team/:memberId/role
// @desc    Update team member role
// @access  Private (Creator only)
router.put("/:memberId/role", authenticate, authorize(["creator"]), TeamController.updateMemberRole)

// @route   DELETE /api/team/:memberId
// @desc    Remove team member
// @access  Private (Creator only)
router.delete("/:memberId", authenticate, authorize(["creator"]), TeamController.removeMember)

export default router
