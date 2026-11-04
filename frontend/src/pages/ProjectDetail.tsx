import NavBar from "@/components/NavBar";
import RoleTag from "@/components/RoleTag";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users,
  Crown,
  Calendar,
  ExternalLink,
  ArrowLeft,
  Send,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function parseSkills(json?: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

function SkillChips({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {skills.slice(0, 8).map((s) => (
        <span
          key={s}
          className="inline-flex items-center rounded-full bg-secondary border border-border px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id ?? "0", 10);
  const { user, isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isValidId = projectId > 0 && Number.isInteger(projectId);

  const utils = trpc.useUtils();
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: isValidId }
  );
  const { data: myRequests } = trpc.joinRequests.myStatuses.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const requestMutation = trpc.joinRequests.request.useMutation({
    onSuccess: () => {
      toast.success("Request sent! The project owner will review it.");
      setDialogOpen(false);
      setMessage("");
      utils.joinRequests.myStatuses.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to send request");
    },
  });

  const myRequest = myRequests?.find((r) => r.projectId === projectId);
  const isOwner = user && project && project.ownerId === user.id;
  const isMember = project?.members.some((m: { id: number }) => m.id === user?.id);

  const canRequest = isAuthenticated && !isOwner && !isMember && !myRequest;

  if (!isValidId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-6">This project may have been removed.</p>
            <Button asChild variant="outline">
              <Link href="/projects">Back to projects</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 py-10">
          <div className="container max-w-3xl">
            <Skeleton className="h-8 w-24 mb-8" />
            <Skeleton className="h-10 w-2/3 mb-3" />
            <Skeleton className="h-4 w-1/3 mb-8" />
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-6">This project may have been removed.</p>
            <Button asChild variant="outline">
              <Link href="/projects">Back to projects</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      <main className="flex-1 py-10">
        <div className="container max-w-3xl page-enter">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                {project.title}
              </h1>
              <Badge
                variant={project.status === "open" ? "default" : "secondary"}
                className="shrink-0 mt-1"
              >
                {project.status === "open" ? "Open" : "Closed"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                <span>
                  by{" "}
                  {project.owner ? (
                    <Link
                      href={`/profile/${project.owner.id}`}
                      className="hover:text-foreground hover:underline transition-colors"
                    >
                      {project.owner.name ?? "Unknown"}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {project.memberCount} / {project.maxTeamSize} members
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Needed Roles */}
          {project.neededRoles.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Looking for
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.neededRoles.map((role: string) => (
                  <RoleTag key={role} role={role} size="md" />
                ))}
              </div>
            </div>
          )}

          <Separator className="mb-8" />

          {/* Description */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">About this project</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {project.description}
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Team */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Team ({project.memberCount})
            </h2>
            <div className="space-y-3">
              {/* Owner */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                <Avatar className="h-9 w-9 border border-border shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getInitials(project.owner?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {project.owner?.id ? (
                    <Link
                      href={`/profile/${project.owner.id}`}
                      className="block text-sm font-medium text-foreground truncate hover:underline"
                    >
                      {project.owner.name ?? "Unknown"}
                      {project.owner.id === user?.id && " (you)"}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate">
                      {project.owner?.name ?? "Unknown"}
                    </p>
                  )}
                  {project.owner?.university && (
                    <p className="text-xs text-muted-foreground truncate">
                      {project.owner.university}
                    </p>
                  )}
                  <SkillChips skills={parseSkills(project.owner?.skills)} />
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  Owner
                </Badge>
              </div>

              {/* Members */}
              {project.members.map((member: { id: number; name?: string | null; university?: string | null; portfolioLink?: string | null; skills?: string | null }) => (
                <div key={member.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20">
                  <Avatar className="h-9 w-9 border border-border shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${member.id}`}
                      className="block text-sm font-medium text-foreground truncate hover:underline"
                    >
                      {member.name ?? "Unknown"}
                      {member.id === user?.id && " (you)"}
                    </Link>
                    {member.university && (
                      <p className="text-xs text-muted-foreground truncate">
                        {member.university}
                      </p>
                    )}
                    <SkillChips skills={parseSkills(member.skills)} />
                  </div>
                  {member.portfolioLink && (
                    <a
                      href={member.portfolioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Join CTA */}
          <div className="rounded-xl border border-border bg-secondary/20 p-6">
            {!isAuthenticated ? (
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">
                  Interested in joining?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to request to join this project.
                </p>
                <Button onClick={() => openSignIn()}>Sign in to Request</Button>
              </div>
            ) : isOwner ? (
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-1">Your project</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Open the team workspace for shared links, or manage join
                  requests from your dashboard.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild>
                    <Link href={`/projects/${project.id}/workspace`}>
                      Open Team Workspace
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            ) : isMember ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You're a member of this project</span>
                </div>
                <Button asChild>
                  <Link href={`/projects/${project.id}/workspace`}>
                    Open Team Workspace
                  </Link>
                </Button>
              </div>
            ) : myRequest ? (
              <div className="text-center">
                {myRequest.status === "pending" && (
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">Request pending review</span>
                  </div>
                )}
                {myRequest.status === "rejected" && (
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Your request was not accepted</span>
                  </div>
                )}
                {myRequest.status === "approved" && (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Request approved — welcome aboard!</span>
                  </div>
                )}
              </div>
            ) : canRequest ? (
              <div className="text-center">
                <h3 className="font-semibold text-foreground mb-2">
                  Want to join this project?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send a request to the project owner with a short message.
                </p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Send className="h-4 w-4" />
                      Request to Join
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Request to Join</DialogTitle>
                      <DialogDescription>
                        Send a message to the project owner explaining why you'd like to join{" "}
                        <strong>{project.title}</strong>.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label htmlFor="message">Message (optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Briefly introduce yourself and your relevant skills..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {message.length}/500
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          requestMutation.mutate({
                            projectId,
                            message: message || undefined,
                          })
                        }
                        disabled={requestMutation.isPending}
                        className="gap-2"
                      >
                        {requestMutation.isPending ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Request
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
