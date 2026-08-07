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
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiClient } from "@/lib/config/api";

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
  const { user } = useAuthStore();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const teamResponse = await apiClient.get<{ team: Team }>("/team", undefined, { withCredentials: true });
      setTeam(teamResponse.team);
    } catch (error) {
      console.error("Failed to load team data:", error);
      setError(error instanceof Error ? error.message : "Failed to load team data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    try {
      setIsInviting(true);
      setError(null);
      await apiClient.post("/team/invite", { email: inviteEmail, role: inviteRole }, undefined, { withCredentials: true });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("editor");
      await loadTeamData();
    } catch (error) {
      console.error("Failed to invite member:", error);
      setError(error instanceof Error ? error.message : "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      setError(null);
      await apiClient.put(`/team/members/${memberId}/role`, { role: newRole }, undefined, { withCredentials: true });
      await loadTeamData();
    } catch (error) {
      console.error("Failed to update member role:", error);
      setError(error instanceof Error ? error.message : "Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setError(null);
      await apiClient.delete(`/team/members/${memberId}`, undefined, { withCredentials: true });
      await loadTeamData();
    } catch (error) {
      console.error("Failed to remove member:", error);
      setError(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  const handlePromoteToCreator = async () => {
    try {
      setError(null);
      await apiClient.post("/team/promote", {}, undefined, { withCredentials: true });
      await loadTeamData();
    } catch (error) {
      console.error("Failed to promote to creator:", error);
      setError(error instanceof Error ? error.message : "Failed to promote to creator");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "creator": return <Crown className="w-3.5 h-3.5 text-yellow-600" />;
      case "manager": return <Shield className="w-3.5 h-3.5 text-teal-700" />;
      case "editor": return <Edit className="w-3.5 h-3.5 text-stone-500" />;
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-3.5 h-3.5 text-teal-700" />;
      case "pending": return <Clock className="w-3.5 h-3.5 text-yellow-600" />;
      case "inactive": return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
      default: return null;
    }
  };

  const canManageMembers = team?.members?.some(
    (member) => member.userId._id === user?.id && ["creator", "manager"].includes(member.role)
  ) || false;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE]">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900">Please log in to access team management</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-[#FAF6EE]">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-teal-700/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-teal-700" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900 mb-2">No team found</h1>
          <p className="text-stone-500">You don't seem to be part of any team yet.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: "Total Members", value: team.members.length, tint: "text-teal-700" },
    { icon: CheckCircle, label: "Active", value: team.members.filter((m) => m.status === "active").length, tint: "text-teal-700" },
    { icon: Clock, label: "Pending", value: team.members.filter((m) => m.status === "pending").length, tint: "text-yellow-600" },
    { icon: Crown, label: "Managers", value: team.members.filter((m) => m.role === "manager").length, tint: "text-yellow-600" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-900/10 pb-6 mb-8 gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold text-teal-700 mb-2">Workspace</p>
            <h1 className="font-display text-4xl font-semibold text-stone-900 tracking-tight">Team</h1>
            <p className="text-stone-500 mt-2">Manage your members and their permissions.</p>
          </div>
          <div className="flex gap-2">
            {team.members.length === 1 && team.members[0].userId._id === user?.id && team.members[0].role === "editor" && (
              <Button onClick={handlePromoteToCreator} className="bg-stone-900 hover:bg-stone-800 text-white rounded-full h-11 px-6">
                <Crown className="w-4 h-4 mr-2" /> Become Creator
              </Button>
            )}

            {canManageMembers && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-700 hover:bg-teal-800 text-white rounded-full h-11 px-6 shadow-lg shadow-teal-900/15">
                    <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl border-stone-200">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl font-semibold">Invite Team Member</DialogTitle>
                    <DialogDescription>Send an invitation to join your team.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="email" className="font-medium text-stone-700">Email Address</Label>
                      <Input id="email" type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="mt-1.5 h-11 rounded-xl border-stone-300 focus-visible:border-teal-600 focus-visible:ring-teal-600/30" />
                    </div>
                    <div>
                      <Label htmlFor="role" className="font-medium text-stone-700">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="mt-1.5 h-11 rounded-xl border-stone-300 focus:ring-teal-600/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="pt-6">
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="rounded-full border-stone-300">Cancel</Button>
                    <Button onClick={handleInviteMember} disabled={isInviting || !inviteEmail} className="bg-teal-700 hover:bg-teal-800 text-white rounded-full">
                      {isInviting ? "Sending..." : "Send Invitation"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 rounded-2xl border-red-200 bg-red-50 text-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {team.members.length === 1 && team.members[0].userId._id === user?.id && team.members[0].role === "editor" && (
          <Alert className="mb-6 rounded-2xl border-yellow-500/30 bg-yellow-400/10">
            <AlertCircle className="h-4 w-4 text-yellow-700" />
            <AlertDescription className="text-stone-700">
              You're currently an editor. To invite team members, become a creator first by clicking "Become Creator".
            </AlertDescription>
          </Alert>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="p-6 bg-white border border-stone-900/8 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-2 text-stone-500 uppercase tracking-wider text-xs font-bold mb-3">
                <s.icon className={`w-4 h-4 ${s.tint}`} /> <span>{s.label}</span>
              </div>
              <p className="font-display text-3xl font-semibold text-stone-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Team Members List */}
        <Card className="rounded-2xl shadow-sm border border-stone-900/8 bg-white">
          <CardHeader className="border-b border-stone-100 pb-4">
            <CardTitle className="font-display text-xl font-semibold text-stone-900">Members Directory</CardTitle>
            <CardDescription className="text-stone-500">Manage permissions and access</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {team.members.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {team.members.map((member) => (
                  <div key={member._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#FAF6EE] transition-colors gap-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12 rounded-2xl border border-stone-200">
                        <AvatarImage src={member.userId.avatar} alt={member.userId.name} className="object-cover rounded-2xl" />
                        <AvatarFallback className="rounded-2xl bg-teal-700/10 text-teal-700 font-semibold text-lg">
                          {member.userId.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-stone-900">{member.userId.name}</p>
                          {getStatusIcon(member.status)}
                        </div>
                        <p className="text-sm text-stone-500 flex items-center mt-0.5">
                          <Mail className="w-3.5 h-3.5 mr-1.5 opacity-70" /> {member.userId.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:ml-auto">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-full shadow-none font-semibold border-none">
                          <div className="flex items-center space-x-1.5">
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </Badge>
                        <Badge className={`rounded-full shadow-none font-semibold border-none capitalize ${member.status === "active" ? "bg-teal-700/10 text-teal-800 hover:bg-teal-700/15" : "bg-stone-100 text-stone-500"}`}>
                          {member.status}
                        </Badge>
                      </div>

                      {canManageMembers && member.role !== "creator" && member.userId._id !== user?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-stone-200">
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.userId._id, "manager")} className="focus:bg-stone-100 cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" /> Make Manager
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateRole(member.userId._id, "editor")} className="focus:bg-stone-100 cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" /> Make Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemoveMember(member.userId._id)} className="text-red-600 focus:bg-red-50 cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" /> Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 font-medium">No team members found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
