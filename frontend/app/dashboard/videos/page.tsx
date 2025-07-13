// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Upload,
//   Video,
//   Search,
//   MoreHorizontal,
//   Play,
//   Youtube,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Eye,
//   ArrowLeft,
//   Filter,
//   Grid3X3,
//   List,
//   Calendar,
//   User,
//   FileVideo,
//   TrendingUp,
//   AlertCircle,
//   Loader2,
// } from "lucide-react";
// import { useAuthStore } from "@/lib/stores/auth-store";
// import { useVideoStore } from "@/lib/stores/video-store";
// import Link from "next/link";
// import { cn } from "@/lib/utils";

// export default function VideosPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { user } = useAuthStore();
//   const { videos, fetchVideos, isLoading, error } = useVideoStore();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [sortBy, setSortBy] = useState("newest");
//   const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
//   const [selectedTab, setSelectedTab] = useState("all");

//   useEffect(() => {
//     if (user?.id) {
//       // Only check for user.id
//       fetchVideos();
//     }
//   }, [user?.id]); // Only depend on user.id

//   useEffect(() => {
//     const tab = searchParams.get("tab");
//     if (tab) {
//       setSelectedTab(tab);
//     }
//   }, [searchParams]);

//   const filteredVideos = videos
//     .filter((video) => {
//       const matchesSearch = video.title
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());
//       const matchesStatus =
//         statusFilter === "all" || video.status === statusFilter;
//       const matchesTab =
//         selectedTab === "all" ||
//         (selectedTab === "pending" && video.status === "pending") ||
//         (selectedTab === "approved" && video.status === "approved") ||
//         (selectedTab === "published" && video.status === "published") ||
//         (selectedTab === "rejected" && video.status === "rejected");
//       return matchesSearch && matchesStatus && matchesTab;
//     })
//     .sort((a, b) => {
//       switch (sortBy) {
//         case "newest":
//           return (
//             new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
//           );
//         case "oldest":
//           return (
//             new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
//           );
//         case "title":
//           return a.title.localeCompare(b.title);
//         case "status":
//           return a.status.localeCompare(b.status);
//         default:
//           return 0;
//       }
//     });

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "published":
//         return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
//       case "approved":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
//       case "rejected":
//         return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
//       case "uploading":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "published":
//         return <Youtube className="w-4 h-4" />;
//       case "approved":
//         return <CheckCircle className="w-4 h-4" />;
//       case "pending":
//         return <Clock className="w-4 h-4" />;
//       case "rejected":
//         return <XCircle className="w-4 h-4" />;
//       case "uploading":
//         return <Upload className="w-4 h-4" />;
//       default:
//         return <Video className="w-4 h-4" />;
//     }
//   };

//   const formatDuration = (seconds: number) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
//   };

//   const getVideoStats = () => {
//     const stats = {
//       total: videos.length,
//       pending: videos.filter((v) => v.status === "pending").length,
//       approved: videos.filter((v) => v.status === "approved").length,
//       published: videos.filter((v) => v.status === "published").length,
//       rejected: videos.filter((v) => v.status === "rejected").length,
//     };
//     return stats;
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold mb-4">
//             Please log in to access videos
//           </h1>
//           <Link href="/auth/login">
//             <Button>Go to Login</Button>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const stats = getVideoStats();

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <div className="bg-card border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-4">
//               <Link href="/dashboard">
//                 <Button variant="ghost" size="sm">
//                   <ArrowLeft className="w-4 h-4 mr-2" />
//                   Back to Dashboard
//                 </Button>
//               </Link>
//               <div>
//                 <h1 className="text-xl font-semibold">All Videos</h1>
//                 <p className="text-sm text-muted-foreground">
//                   {stats.total} total videos
//                 </p>
//               </div>
//             </div>
//             <Link href="/dashboard/upload">
//               <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
//                 <Upload className="w-4 h-4 mr-2" />
//                 Upload Video
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {error && (
//           <Alert variant="destructive" className="mb-6">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {/* Stats Cards */}
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
//           <Card className="border-l-4 border-l-blue-500">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-2xl font-bold">{stats.total}</p>
//                   <p className="text-xs text-muted-foreground">Total</p>
//                 </div>
//                 <Video className="w-8 h-8 text-blue-500" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-yellow-500">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-2xl font-bold">{stats.pending}</p>
//                   <p className="text-xs text-muted-foreground">Pending</p>
//                 </div>
//                 <Clock className="w-8 h-8 text-yellow-500" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-blue-500">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-2xl font-bold">{stats.approved}</p>
//                   <p className="text-xs text-muted-foreground">Approved</p>
//                 </div>
//                 <CheckCircle className="w-8 h-8 text-blue-500" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-green-500">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-2xl font-bold">{stats.published}</p>
//                   <p className="text-xs text-muted-foreground">Published</p>
//                 </div>
//                 <Youtube className="w-8 h-8 text-green-500" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-red-500">
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-2xl font-bold">{stats.rejected}</p>
//                   <p className="text-xs text-muted-foreground">Rejected</p>
//                 </div>
//                 <XCircle className="w-8 h-8 text-red-500" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Tabs */}
//         <Tabs
//           value={selectedTab}
//           onValueChange={setSelectedTab}
//           className="mb-6"
//         >
//           <TabsList className="grid w-full grid-cols-5">
//             <TabsTrigger value="all">All Videos</TabsTrigger>
//             <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
//             <TabsTrigger value="approved">
//               Approved ({stats.approved})
//             </TabsTrigger>
//             <TabsTrigger value="published">
//               Published ({stats.published})
//             </TabsTrigger>
//             <TabsTrigger value="rejected">
//               Rejected ({stats.rejected})
//             </TabsTrigger>
//           </TabsList>
//         </Tabs>

//         {/* Filters and Controls */}
//         <Card className="mb-6">
//           <CardContent className="p-6">
//             <div className="flex flex-col lg:flex-row gap-4 items-center">
//               <div className="flex-1 w-full">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//                   <Input
//                     placeholder="Search videos..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 <Select value={statusFilter} onValueChange={setStatusFilter}>
//                   <SelectTrigger className="w-[140px]">
//                     <Filter className="w-4 h-4 mr-2" />
//                     <SelectValue placeholder="Status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Status</SelectItem>
//                     <SelectItem value="pending">Pending</SelectItem>
//                     <SelectItem value="approved">Approved</SelectItem>
//                     <SelectItem value="published">Published</SelectItem>
//                     <SelectItem value="rejected">Rejected</SelectItem>
//                   </SelectContent>
//                 </Select>

//                 <Select value={sortBy} onValueChange={setSortBy}>
//                   <SelectTrigger className="w-[140px]">
//                     <TrendingUp className="w-4 h-4 mr-2" />
//                     <SelectValue placeholder="Sort by" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="newest">Newest First</SelectItem>
//                     <SelectItem value="oldest">Oldest First</SelectItem>
//                     <SelectItem value="title">Title A-Z</SelectItem>
//                     <SelectItem value="status">Status</SelectItem>
//                   </SelectContent>
//                 </Select>

//                 <div className="flex border rounded-md">
//                   <Button
//                     variant={viewMode === "grid" ? "default" : "ghost"}
//                     size="sm"
//                     onClick={() => setViewMode("grid")}
//                     className="rounded-r-none"
//                   >
//                     <Grid3X3 className="w-4 h-4" />
//                   </Button>
//                   <Button
//                     variant={viewMode === "list" ? "default" : "ghost"}
//                     size="sm"
//                     onClick={() => setViewMode("list")}
//                     className="rounded-l-none"
//                   >
//                     <List className="w-4 h-4" />
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Loading State */}
//         {isLoading && (
//           <div className="flex items-center justify-center py-12">
//             <Loader2 className="w-8 h-8 animate-spin" />
//           </div>
//         )}

//         {/* Videos Grid/List */}
//         {!isLoading && (
//           <>
//             {viewMode === "grid" ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                 {filteredVideos.map((video) => (
//                   <Card
//                     key={video.id}
//                     className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
//                     onClick={() => router.push(`/dashboard/videos/${video.id}`)}
//                   >
//                     <div className="aspect-video bg-muted relative overflow-hidden">
//                       <img
//                         src={
//                           video.thumbnail ||
//                           "/placeholder.svg?height=180&width=320"
//                         }
//                         alt={video.title}
//                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
//                       />
//                       <div className="absolute top-2 right-2">
//                         <Badge
//                           className={cn(
//                             "text-xs",
//                             getStatusColor(video.status)
//                           )}
//                         >
//                           {getStatusIcon(video.status)}
//                           <span className="ml-1 capitalize">
//                             {video.status}
//                           </span>
//                         </Badge>
//                       </div>
//                       <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
//                         {formatDuration(video.duration)}
//                       </div>
//                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
//                         <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
//                       </div>
//                     </div>
//                     <CardHeader className="pb-2">
//                       <div className="flex justify-between items-start">
//                         <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
//                           {video.title}
//                         </CardTitle>
//                         <DropdownMenu>
//                           <DropdownMenuTrigger
//                             asChild
//                             onClick={(e) => e.stopPropagation()}
//                           >
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               <MoreHorizontal className="w-4 h-4" />
//                             </Button>
//                           </DropdownMenuTrigger>
//                           <DropdownMenuContent align="end">
//                             <DropdownMenuItem
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 router.push(`/dashboard/videos/${video.id}`);
//                               }}
//                             >
//                               <Eye className="w-4 h-4 mr-2" />
//                               View & Review
//                             </DropdownMenuItem>
//                             {user?.role === "creator" &&
//                               video.status === "pending" && (
//                                 <>
//                                   <DropdownMenuItem
//                                     onClick={(e) => e.stopPropagation()}
//                                   >
//                                     <CheckCircle className="w-4 h-4 mr-2" />
//                                     Quick Approve
//                                   </DropdownMenuItem>
//                                   <DropdownMenuItem
//                                     onClick={(e) => e.stopPropagation()}
//                                   >
//                                     <XCircle className="w-4 h-4 mr-2" />
//                                     Quick Reject
//                                   </DropdownMenuItem>
//                                 </>
//                               )}
//                           </DropdownMenuContent>
//                         </DropdownMenu>
//                       </div>
//                       <CardDescription className="line-clamp-2 text-sm">
//                         {video.description}
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent className="pt-0">
//                       <div className="flex items-center justify-between text-sm text-muted-foreground">
//                         <div className="flex items-center">
//                           <User className="w-3 h-3 mr-1" />
//                           {video.uploadedBy.name}
//                         </div>
//                         <div className="flex items-center">
//                           <Calendar className="w-3 h-3 mr-1" />
//                           {new Date(video.uploadedAt).toLocaleDateString()}
//                         </div>
//                       </div>
//                       {video.youtubeUrl && (
//                         <div className="mt-3">
//                           <Link
//                             href={video.youtubeUrl}
//                             target="_blank"
//                             onClick={(e) => e.stopPropagation()}
//                           >
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               className="w-full bg-transparent"
//                             >
//                               <Youtube className="w-4 h-4 mr-2" />
//                               View on YouTube
//                             </Button>
//                           </Link>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {filteredVideos.map((video) => (
//                   <Card
//                     key={video.id}
//                     className="hover:shadow-md transition-shadow cursor-pointer"
//                     onClick={() => router.push(`/dashboard/videos/${video.id}`)}
//                   >
//                     <CardContent className="p-4">
//                       <div className="flex items-center space-x-4">
//                         <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
//                           <img
//                             src={
//                               video.thumbnail ||
//                               "/placeholder.svg?height=80&width=128"
//                             }
//                             alt={video.title}
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between">
//                             <div className="flex-1">
//                               <h3 className="font-medium text-lg line-clamp-1 mb-1">
//                                 {video.title}
//                               </h3>
//                               <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
//                                 {video.description}
//                               </p>
//                               <div className="flex items-center space-x-4 text-sm text-muted-foreground">
//                                 <div className="flex items-center">
//                                   <User className="w-3 h-3 mr-1" />
//                                   {video.uploadedBy.name}
//                                 </div>
//                                 <div className="flex items-center">
//                                   <Calendar className="w-3 h-3 mr-1" />
//                                   {new Date(
//                                     video.uploadedAt
//                                   ).toLocaleDateString()}
//                                 </div>
//                                 <div className="flex items-center">
//                                   <Clock className="w-3 h-3 mr-1" />
//                                   {formatDuration(video.duration)}
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="flex items-center space-x-2 ml-4">
//                               <Badge
//                                 className={cn(
//                                   "text-xs",
//                                   getStatusColor(video.status)
//                                 )}
//                               >
//                                 {getStatusIcon(video.status)}
//                                 <span className="ml-1 capitalize">
//                                   {video.status}
//                                 </span>
//                               </Badge>
//                               <DropdownMenu>
//                                 <DropdownMenuTrigger
//                                   asChild
//                                   onClick={(e) => e.stopPropagation()}
//                                 >
//                                   <Button variant="ghost" size="sm">
//                                     <MoreHorizontal className="w-4 h-4" />
//                                   </Button>
//                                 </DropdownMenuTrigger>
//                                 <DropdownMenuContent align="end">
//                                   <DropdownMenuItem
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       router.push(
//                                         `/dashboard/videos/${video.id}`
//                                       );
//                                     }}
//                                   >
//                                     <Eye className="w-4 h-4 mr-2" />
//                                     View & Review
//                                   </DropdownMenuItem>
//                                   {user?.role === "creator" &&
//                                     video.status === "pending" && (
//                                       <>
//                                         <DropdownMenuItem
//                                           onClick={(e) => e.stopPropagation()}
//                                         >
//                                           <CheckCircle className="w-4 h-4 mr-2" />
//                                           Quick Approve
//                                         </DropdownMenuItem>
//                                         <DropdownMenuItem
//                                           onClick={(e) => e.stopPropagation()}
//                                         >
//                                           <XCircle className="w-4 h-4 mr-2" />
//                                           Quick Reject
//                                         </DropdownMenuItem>
//                                       </>
//                                     )}
//                                 </DropdownMenuContent>
//                               </DropdownMenu>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}

//             {filteredVideos.length === 0 && (
//               <div className="text-center py-12">
//                 <FileVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
//                 <h3 className="text-xl font-medium mb-2">No videos found</h3>
//                 <p className="text-muted-foreground mb-6">
//                   {searchTerm || statusFilter !== "all"
//                     ? "Try adjusting your search or filters"
//                     : "Upload your first video to get started"}
//                 </p>
//                 <Link href="/dashboard/upload">
//                   <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
//                     <Upload className="w-4 h-4 mr-2" />
//                     Upload Video
//                   </Button>
//                 </Link>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }












































































"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  Video,
  Search,
  MoreHorizontal,
  Play,
  Youtube,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Filter,
  Grid3X3,
  List,
  Calendar,
  User,
  FileVideo,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useVideoStore } from "@/lib/stores/video-store"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function VideosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const { videos, fetchVideos, isLoading, error } = useVideoStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    if (user?.id) {
      fetchVideos()
    }
  }, [user?.id])

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      setSelectedTab(tab)
    }
  }, [searchParams])

  const filteredVideos = videos
    .filter((video) => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || video.status === statusFilter
      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "pending" && video.status === "pending") ||
        (selectedTab === "approved" && video.status === "approved") ||
        (selectedTab === "published" && video.status === "published") ||
        (selectedTab === "rejected" && video.status === "rejected")

      return matchesSearch && matchesStatus && matchesTab
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        case "oldest":
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
      case "uploading":
        return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Youtube className="w-3.5 h-3.5" />
      case "approved":
        return <CheckCircle className="w-3.5 h-3.5" />
      case "pending":
        return <Clock className="w-3.5 h-3.5" />
      case "rejected":
        return <XCircle className="w-3.5 h-3.5" />
      case "uploading":
        return <Upload className="w-3.5 h-3.5" />
      default:
        return <Video className="w-3.5 h-3.5" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getVideoStats = () => {
    const stats = {
      total: videos.length,
      pending: videos.filter((v) => v.status === "pending").length,
      approved: videos.filter((v) => v.status === "approved").length,
      published: videos.filter((v) => v.status === "published").length,
      rejected: videos.filter((v) => v.status === "rejected").length,
    }
    return stats
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
            Please log in to access videos
          </h1>
          <Link href="/auth/login">
            <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stats = getVideoStats()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Videos</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stats.total} total videos</p>
              </div>
            </div>
            <Link href="/dashboard/upload">
              <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.total}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{stats.pending}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending</p>
                </div>
                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-blue-700 dark:text-blue-400">{stats.approved}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Approved</p>
                </div>
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">{stats.published}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Published</p>
                </div>
                <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-red-700 dark:text-red-400">{stats.rejected}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rejected</p>
                </div>
                <div className="w-8 h-8 bg-red-50 dark:bg-red-950 rounded-lg flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100"
            >
              All Videos
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-400"
            >
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400"
            >
              Approved ({stats.approved})
            </TabsTrigger>
            <TabsTrigger
              value="published"
              className="data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
            >
              Published ({stats.published})
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-950 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400"
            >
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters and Controls */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-gray-400 dark:focus:border-gray-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "rounded-none border-0",
                      viewMode === "grid"
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700",
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "rounded-none border-0",
                      viewMode === "list"
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700",
                    )}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading videos...</p>
            </div>
          </div>
        )}

        {/* Videos Grid/List */}
        {!isLoading && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    onClick={() => router.push(`/dashboard/videos/${video.id}`)}
                  >
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                      <img
                        src={video.thumbnail || "/placeholder.svg?height=180&width=320" || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className={cn("text-xs font-medium border", getStatusColor(video.status))}>
                          {getStatusIcon(video.status)}
                          <span className="ml-1.5 capitalize">{video.status}</span>
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs px-2 py-1 rounded font-medium">
                        {formatDuration(video.duration)}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base line-clamp-2 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors font-medium">
                          {video.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/dashboard/videos/${video.id}`)
                              }}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View & Review
                            </DropdownMenuItem>
                            {user?.role === "creator" && video.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Quick Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Quick Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {video.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          <span className="font-medium">{video.uploadedBy.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(video.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {video.youtubeUrl && (
                        <Link href={video.youtubeUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                          >
                            <Youtube className="w-4 h-4 mr-2" />
                            View on YouTube
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    onClick={() => router.push(`/dashboard/videos/${video.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="w-40 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={video.thumbnail || "/placeholder.svg?height=96&width=160" || "/placeholder.svg"}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-lg line-clamp-1 mb-2 text-gray-900 dark:text-gray-100">
                                {video.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                {video.description}
                              </p>
                              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center">
                                  <User className="w-4 h-4 mr-2" />
                                  <span className="font-medium">{video.uploadedBy.name}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  {new Date(video.uploadedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  {formatDuration(video.duration)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 ml-6">
                              <Badge className={cn("text-xs font-medium border", getStatusColor(video.status))}>
                                {getStatusIcon(video.status)}
                                <span className="ml-1.5 capitalize">{video.status}</span>
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                >
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      router.push(`/dashboard/videos/${video.id}`)
                                    }}
                                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View & Review
                                  </DropdownMenuItem>
                                  {user?.role === "creator" && video.status === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={(e) => e.stopPropagation()}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Quick Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => e.stopPropagation()}
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Quick Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {filteredVideos.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileVideo className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No videos found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for"
                    : "Upload your first video to get started with your content library"}
                </p>
                <Link href="/dashboard/upload">
                  <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Video
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
