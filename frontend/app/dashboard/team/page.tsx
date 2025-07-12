"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Crown,
  Shield,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiClient } from "@/lib/config/api";
import { MainNav } from "@/components/main-nav";

interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: "creator" | "manager" | "editor";
  status: "active" | "pending" | "inactive";
  joinedAt: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
}

export default function TeamPage() {
  const { user } = useAuthStore(); // Remove refreshToken from destructuring
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
    // Remove refreshToken() call
  }, []); // Remove refreshToken from dependencies

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const teamResponse = await apiClient.get<{ team: Team }>(
        "/team", // Fix: Change back to "/team" to match backend
        undefined,
        { withCredentials: true }
      );
      setTeam(teamResponse.team);
    } catch (error) {
      console.error("Failed to load team data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load team data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setError(null);

      await apiClient.post(
        "/team/invite", // Fix: Change back to "/team/invite"
        {
          email: inviteEmail,
          role: inviteRole,
        },
        undefined,
        { withCredentials: true }
      );

      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("editor");
      await loadTeamData();
    } catch (error) {
      console.error("Failed to invite member:", error);
      setError(
        error instanceof Error ? error.message : "Failed to invite member"
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      setError(null);

      await apiClient.put(
        `/team/members/${memberId}/role`, // Fix: Change back to "/team/members"
        { role: newRole },
        undefined,
        { withCredentials: true }
      );
      await loadTeamData();
    } catch (error) {
      console.error("Failed to update member role:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update member role"
      );
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setError(null);

      await apiClient.delete(`/team/members/${memberId}`, undefined, { // Fix: Change back to "/team/members"
        withCredentials: true,
      });
      await loadTeamData();
    } catch (error) {
      console.error("Failed to remove member:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove member"
      );
    }
  };

  const handlePromoteToCreator = async () => {
    try {
      setError(null);

      await apiClient.post("/team/promote", {}, undefined, { // Fix: Change back to "/team/promote"
        withCredentials: true,
      });
      await loadTeamData();
      // Remove refreshToken call
    } catch (error) {
      console.error("Failed to promote to creator:", error);
      setError(
        error instanceof Error ? error.message : "Failed to promote to creator"
      );
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "creator":
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case "manager":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "editor":
        return <Edit className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "inactive":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Check if user can manage members based on their team role, not individual role
  const canManageMembers =
    team?.members?.some(
      (member) =>
        member.userId._id === user?.id &&
        ["creator", "manager"].includes(member.role)
    ) || false;

  if (!user) {
    return (
      <>
        <MainNav />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              Please log in to access team management
            </h1>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!team) {
    return (
      <>
        <MainNav />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">No team found</h1>
              <p className="text-gray-600">
                You don't seem to be part of any team yet.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Team Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your team members and permissions
              </p>
            </div>
            <div className="flex gap-2">
              {/* Show promote button if user is the only member and has editor role */}
              {team.members.length === 1 &&
                team.members[0].userId._id === user?.id &&
                team.members[0].role === "editor" && (
                  <Button
                    onClick={handlePromoteToCreator}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Become Creator
                  </Button>
                )}

              {canManageMembers && (
                <Dialog
                  open={isInviteDialogOpen}
                  onOpenChange={setIsInviteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your team.
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
                        <Select
                          value={inviteRole}
                          onValueChange={setInviteRole}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInviteMember}
                        disabled={isInviting || !inviteEmail}
                      >
                        {isInviting ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Show info message if user is editor and only team member */}
          {team.members.length === 1 &&
            team.members[0].userId._id === user?.id &&
            team.members[0].role === "editor" && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're currently an editor. To invite team members, you need
                  to become a creator first. Click "Become Creator" to upgrade
                  your role.
                </AlertDescription>
              </Alert>
            )}

          {/* Team Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{team.members.length}</p>
                    <p className="text-sm text-gray-600">Total Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {team.members.filter((m) => m.status === "active").length}
                    </p>
                    <p className="text-sm text-gray-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {
                        team.members.filter((m) => m.status === "pending")
                          .length
                      }
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {team.members.filter((m) => m.role === "manager").length}
                    </p>
                    <p className="text-sm text-gray-600">Managers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({team.members.length})</CardTitle>
              <CardDescription>
                Manage your team members and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {team.members.length > 0 ? (
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={member.userId.avatar || "/placeholder.svg"}
                            alt={member.userId.name}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            {member.userId.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-sm truncate">
                              {member.userId.name}
                            </p>
                            {getStatusIcon(member.status)}
                          </div>
                          <p className="text-sm text-gray-600 truncate flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {member.userId.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              <div className="flex items-center space-x-1">
                                {getRoleIcon(member.role)}
                                <span className="capitalize">
                                  {member.role}
                                </span>
                              </div>
                            </Badge>
                            <Badge
                              variant={
                                member.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {member.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {canManageMembers &&
                        member.role !== "creator" &&
                        member.userId._id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateRole(member.userId._id, "manager")
                                }
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make Manager
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateRole(member.userId._id, "editor")
                                }
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Make Editor
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleRemoveMember(member.userId._id)
                                }
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
