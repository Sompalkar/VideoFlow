"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Crown,
  Shield,
  Edit,
  Eye,
  Trash2,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { ApiClient } from "@/lib/config/api"

interface TeamMember {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  role: "creator" | "manager" | "editor" | "viewer"
  status: "active" | "pending" | "inactive"
  joinedAt: string
}

interface TeamStats {
  totalMembers: number
  activeMembers: number
  pendingMembers: number
  roleDistribution: {
    creator: number
    manager: number
    editor: number
    viewer: number
  }
}

export default function TeamPage() {
  const { user } = useAuthStore()
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("viewer")
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      setIsLoading(true)
      const [teamResponse, statsResponse] = await Promise.all([ApiClient.get("/team"), ApiClient.get("/team/stats")])

      setTeam(teamResponse.team)
      setMembers(teamResponse.team.members || [])
      setStats(statsResponse.stats)
    } catch (error) {
      console.error("Failed to load team data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteMember = async () => {
    try {
      setIsInviting(true)
      await ApiClient.post("/team/invite", {
        email: inviteEmail,
        role: inviteRole,
      })

      setIsInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("viewer")
      await loadTeamData()
    } catch (error) {
      console.error("Failed to invite member:", error)
    } finally {
      setIsInviting(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await ApiClient.put(`/team/members/${memberId}/role`, { role: newRole })
      await loadTeamData()
    } catch (error) {
      console.error("Failed to update member role:", error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await ApiClient.delete(`/team/members/${memberId}`)
      await loadTeamData()
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "creator":
        return <Crown className="w-4 h-4 text-yellow-600" />
      case "manager":
        return <Shield className="w-4 h-4 text-blue-600" />
      case "editor":
        return <Edit className="w-4 h-4 text-green-600" />
      case "viewer":
        return <Eye className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "inactive":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.userId.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const canManageMembers = user?.role === "creator" || user?.role === "manager"

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your team members, roles, and permissions</p>
        </div>
        {canManageMembers && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your team. They'll receive an email with instructions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Can view content</SelectItem>
                      <SelectItem value="editor">Editor - Can edit and upload</SelectItem>
                      <SelectItem value="manager">Manager - Can manage team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail}>
                  {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Stats */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeMembers}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingMembers}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.roleDistribution.manager}</p>
                  <p className="text-sm text-gray-600">Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
          <CardDescription>Manage your team members and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length > 0 ? (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.userId.avatar || "/placeholder.svg"} alt={member.userId.name} />
                      <AvatarFallback>{member.userId.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{member.userId.name}</p>
                        {getStatusIcon(member.status)}
                      </div>
                      <p className="text-sm text-gray-600">{member.userId.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </Badge>
                        <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {canManageMembers && member.role !== "creator" && member.userId._id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId._id, "manager")}>
                          <Shield className="w-4 h-4 mr-2" />
                          Make Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId._id, "editor")}>
                          <Edit className="w-4 h-4 mr-2" />
                          Make Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.userId._id, "viewer")}>
                          <Eye className="w-4 h-4 mr-2" />
                          Make Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveMember(member.userId._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Understanding what each role can do in your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Creator</p>
                  <p className="text-sm text-gray-600">Full access to all features, team management, and billing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Manager</p>
                  <p className="text-sm text-gray-600">Can manage team members, upload content, and view analytics</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Edit className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Editor</p>
                  <p className="text-sm text-gray-600">Can upload and edit content, but cannot manage team</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Eye className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-medium">Viewer</p>
                  <p className="text-sm text-gray-600">Can only view content and basic analytics</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
