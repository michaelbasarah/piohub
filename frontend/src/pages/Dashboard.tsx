import NavBar from "@/components/NavBar";
import RoleTag from "@/components/RoleTag";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Briefcase,
  Users,
  UserCircle,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  ExternalLink,
  Edit3,
  Save,
  X,
  GraduationCap,
  Link2,
  Layers,
} from "lucide-react";
import { Link } from "wouter";
import { useState, type KeyboardEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Profile Editor ────────────────────────────────────────────────────────────

function ProfileEditor({ user }: { user: { name?: string | null; university?: string | null; skills?: string[]; portfolioLink?: string | null; bio?: string | null } }) {
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [university, setUniversity] = useState(user.university ?? "");
  const [portfolioLink, setPortfolioLink] = useState(user.portfolioLink ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [skills, setSkills] = useState<string[]>(user.skills ?? []);
  const [skillInput, setSkillInput] = useState("");

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated!");
      setEditing(false);
      utils.dashboard.myData.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update profile");
    },
  });

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.length >= 20) return;
    if (!skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
    if (e.key === "Backspace" && !skillInput && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: name || undefined,
      university: university || null,
      skills,
      portfolioLink: portfolioLink || null,
      bio: bio || null,
    });
  };

  const handleCancel = () => {
    setName(user.name ?? "");
    setUniversity(user.university ?? "");
    setPortfolioLink(user.portfolioLink ?? "");
    setBio(user.bio ?? "");
    setSkills(user.skills ?? []);
    setSkillInput("");
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-border">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg text-foreground">{user.name ?? "Your Name"}</h3>
            {user.university && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {user.university}
              </p>
            )}
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-4">
          {user.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
          )}
          {user.portfolioLink && (
            <a
              href={user.portfolioLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Link2 className="h-3.5 w-3.5" />
              Portfolio / GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {user.skills && user.skills.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {user.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-secondary border border-border px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No skills added yet. Edit your profile to add skills.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Display Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">University</Label>
              <Input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. MIT, Stanford..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Portfolio / GitHub Link</Label>
            <Input
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              placeholder="https://github.com/yourname"
              type="url"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Skills</Label>
            <div className="flex flex-wrap gap-2 min-h-[44px] rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-medium"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={skills.length === 0 ? "Type a skill and press Enter..." : "Add more..."}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Join Request Card ─────────────────────────────────────────────────────────

function JoinRequestCard({
  request,
  onRespond,
  isPending,
}: {
  request: {
    id: number;
    message?: string | null;
    createdAt: Date | string;
    project?: { id: number; title: string } | null;
    requester?: { id: number; name?: string | null; university?: string | null; portfolioLink?: string | null } | null;
  };
  onRespond: (id: number, status: "approved" | "rejected") => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-background hover:bg-secondary/20 transition-colors">
      <Avatar className="h-9 w-9 border border-border shrink-0">
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
          {getInitials(request.requester?.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            {request.requester ? (
              <Link
                href={`/profile/${request.requester.id}`}
                className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
              >
                {request.requester.name ?? "Unknown"}
              </Link>
            ) : (
              <p className="text-sm font-medium text-foreground">Unknown</p>
            )}
            {request.requester?.university && (
              <p className="text-xs text-muted-foreground">{request.requester.university}</p>
            )}
          </div>
          {request.project && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {request.project.title}
            </Badge>
          )}
        </div>
        {request.message && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed italic">
            "{request.message}"
          </p>
        )}
        {request.requester?.portfolioLink && (
          <a
            href={request.requester.portfolioLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            Portfolio
          </a>
        )}
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => onRespond(request.id, "approved")}
            disabled={isPending}
            className="gap-1.5 h-7 text-xs"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRespond(request.id, "rejected")}
            disabled={isPending}
            className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const { openSignIn } = useClerk();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.dashboard.myData.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myRequests = [] } = trpc.joinRequests.myStatuses.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const closeMutation = trpc.projects.close.useMutation({
    onSuccess: () => {
      toast.success("Project closed!");
      utils.dashboard.myData.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to close project");
    },
  });

  const reopenMutation = trpc.projects.reopen.useMutation({
    onSuccess: () => {
      toast.success("Project reopened — it's back in the feed!");
      utils.dashboard.myData.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to reopen project");
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      utils.dashboard.myData.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete project");
    },
  });

  const respondMutation = trpc.joinRequests.respond.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.status === "approved" ? "Member approved!" : "Request rejected");
      utils.dashboard.myData.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Action failed");
    },
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 py-10">
          <div className="container max-w-4xl space-y-6">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <UserCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view your dashboard</h2>
            <p className="text-muted-foreground mb-6">Track your projects and manage your profile.</p>
            <Button onClick={() => openSignIn()}>Sign in</Button>
          </div>
        </main>
      </div>
    );
  }

  const { ownedProjects = [], joinedProjects = [], pendingRequests = [], user } = data ?? {};
  const totalPending = pendingRequests.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      <main className="flex-1 py-10">
        <div className="container max-w-4xl page-enter">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user?.name?.split(" ")[0] ?? "there"}
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/projects/new">
                <PlusCircle className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="projects" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">My Projects</span>
                <span className="sm:hidden">Projects</span>
                {totalPending > 0 && (
                  <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {totalPending}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="joined" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Joined</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">My Requests</span>
                <span className="sm:hidden">Requests</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            {/* ── Owned Projects ── */}
            <TabsContent value="projects" className="space-y-6 mt-0">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Projects You Own ({ownedProjects.length})
                  </h2>
                </div>

                {ownedProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
                    <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">No projects yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Post your first project and start building your team.
                    </p>
                    <Button asChild size="sm">
                      <Link href="/projects/new">Post a Project</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ownedProjects.map((project) => {
                      const projectRequests = pendingRequests.filter(
                        (r) => r.projectId === project.id
                      );
                      return (
                        <div key={project.id} className="rounded-xl border border-border bg-card overflow-hidden">
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <Link
                                href={`/projects/${project.id}`}
                                className="font-semibold text-foreground hover:text-primary transition-colors"
                              >
                                {project.title}
                              </Link>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={project.status === "open" ? "default" : "secondary"} className="text-xs">
                                  {project.status}
                                </Badge>
                                <Button
                                  asChild
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                >
                                  <Link href={`/projects/${project.id}/edit`}>Edit</Link>
                                </Button>
                                {project.status === "open" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                      >
                                        Close
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Close project?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Once closed, this project won't appear in the feed and new members can't request to join.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Keep Open</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => closeMutation.mutate({ id: project.id })}
                                          disabled={closeMutation.isPending}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          {closeMutation.isPending ? "Closing..." : "Close Project"}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {project.status === "closed" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => reopenMutation.mutate({ id: project.id })}
                                    disabled={reopenMutation.isPending}
                                  >
                                    {reopenMutation.isPending ? "Reopening..." : "Reopen"}
                                  </Button>
                                )}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                    >
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete project?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This permanently deletes "{project.title}" along with its team,
                                        join requests and workspace links. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate({ id: project.id })}
                                        disabled={deleteMutation.isPending}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {project.neededRoles.map((role: string) => (
                                <RoleTag key={role} role={role} />
                              ))}
                            </div>
                          </div>

                          {projectRequests.length > 0 && (
                            <>
                              <Separator />
                              <div className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock className="h-4 w-4 text-amber-500" />
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Pending Requests ({projectRequests.length})
                                  </h4>
                                </div>
                                <div className="space-y-3">
                                  {projectRequests.map((req) => (
                                    <JoinRequestCard
                                      key={req.id}
                                      request={req}
                                      onRespond={(id, status) =>
                                        respondMutation.mutate({ requestId: id, status })
                                      }
                                      isPending={respondMutation.isPending}
                                    />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Joined Projects ── */}
            <TabsContent value="joined" className="mt-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Projects You've Joined ({joinedProjects.length})
                </h2>

                {joinedProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">Not on any teams yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Browse open projects and request to join a team.
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/projects">Browse Projects</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {joinedProjects.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {project.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs shrink-0">Member</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {project.neededRoles.slice(0, 3).map((role: string) => (
                              <RoleTag key={role} role={role} />
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── My Requests ── */}
            <TabsContent value="requests" className="mt-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  My Join Requests ({myRequests.length})
                </h2>

                {myRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
                    <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-foreground mb-1">No requests yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't requested to join any projects yet.
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/projects">Browse Projects</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRequests.map((request) => {
                      const statusColor =
                        request.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : request.status === "approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200";
                      const StatusIcon =
                        request.status === "pending"
                          ? Clock
                          : request.status === "approved"
                            ? CheckCircle
                            : XCircle;
                      return (
                        <div
                          key={request.id}
                          className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            {request.project && (
                              <Link
                                href={`/projects/${request.project.id}`}
                                className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                              >
                                {request.project.title}
                              </Link>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Requested {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`shrink-0 border ${statusColor}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Profile ── */}
            <TabsContent value="profile" className="mt-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Your Profile</h2>
                {user && <ProfileEditor user={user} />}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
