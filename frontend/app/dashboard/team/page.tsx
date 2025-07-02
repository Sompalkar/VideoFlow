"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MainNav } from "@/components/main-nav"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  Users,
  Crown,
  Edit,
  SettingsIcon,
  MoreHorizontal,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  Shield,
  Trash2,
  Search,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useTeamStore } from "@/lib/stores/team-store"

export default function TeamPage() {
  const { user } = useAuthStore()
  const { members, fetchTeamMembers, inviteMember, updateMemberRole, removeMember, isLoading, error, clearError } =
    useTeamStore()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "editor" as "creator" | "editor" | "manager",
  })

  useEffect(() => {
    if (user) {
      fetchTeamMembers()
    }
  }, [user])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await inviteMember(inviteForm.email, inviteForm.role)
      setShowInviteDialog(false)
      setInviteForm({ email: "", role: "editor" })
    } catch (error) {
      // Error handled by store
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "creator":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "editor":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "creator":
        return <Crown className="w-3 h-3" />
      case "manager":
        return <SettingsIcon className="w-3 h-3" />
      case "editor":
        return <Edit className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access team management</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <MainNav />
      <DashboardNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
              </div>
              <p className="text-gray-600">Manage your team members, roles, and permissions</p>
            </div>
            {user.role === "creator" && (
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to a new team member. They'll receive an email with instructions to join.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite}>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                          required
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={inviteForm.role}
                          onValueChange={(value: any) => setInviteForm((prev) => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">
                              <div className="flex items-center space-x-2">
                                <Edit className="w-4 h-4 text-green-600" />
                                <div>
                                  <div className="font-medium">Editor</div>
                                  <div className="text-xs text-gray-500">Can upload and edit videos</div>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div className="flex items-center space-x-2">
                                <SettingsIcon className="w-4 h-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">Manager</div>
                                  <div className="text-xs text-gray-500">Can manage team and analytics</div>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Team Stats */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Team Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Members</span>
                    <span className="font-semibold">{members.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active</span>
                    <span className="font-semibold text-green-600">
                      {members.filter((m) => m.status === "active").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-amber-600">
                      {members.filter((m) => m.status === "pending").length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Roles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Creators</span>
                    </div>
                    <span className="font-semibold">{members.filter((m) => m.role === "creator").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SettingsIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Managers</span>
                    </div>
                    <span className="font-semibold">{members.filter((m) => m.role === "manager").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Edit className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Editors</span>
                    </div>
                    <span className="font-semibold">{members.filter((m) => m.role === "editor").length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Upload videos</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Manage team</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Approve content</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Team Members List */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Team Members</CardTitle>
                    <CardDescription>Manage your team members and their roles</CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl animate-pulse">
                          <div className="w-12 h-12 bg-gray-200 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm ? "No members found" : "No team members yet"}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "Invite team members to start collaborating on your videos"}
                      </p>
                      {user.role === "creator" && !searchTerm && (
                        <Button
                          onClick={() => setShowInviteDialog(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Your First Member
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-900">{member.name}</h3>
                              <Badge className={`${getRoleColor(member.role)} border rounded-full px-2 py-1`}>
                                {getRoleIcon(member.role)}
                                <span className="ml-1 capitalize text-xs font-medium">{member.role}</span>
                              </Badge>
                              <Badge className={`${getStatusColor(member.status)} rounded-full px-2 py-1`}>
                                {member.status === "active" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <Clock className="w-3 h-3 mr-1" />
                                )}
                                <span className="capitalize text-xs font-medium">{member.status}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {member.email}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {user.role === "creator" && member.role !== "creator" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-xl bg-transparent">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem
                                onClick={() =>
                                  updateMemberRole(member.id, member.role === "editor" ? "manager" : "editor")
                                }
                              >
                                <SettingsIcon className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => removeMember(member.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
