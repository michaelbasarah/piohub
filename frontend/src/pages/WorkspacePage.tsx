import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, ExternalLink, AlertCircle, Lock } from "lucide-react";
import { useState } from "react";
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

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = id ? parseInt(id, 10) : null;
  const { user, isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const utils = trpc.useUtils();

  const { data: project, isLoading: projectLoading } = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId && Number.isInteger(projectId) }
  );

  const { data: links = [], isLoading: linksLoading } = trpc.workspace.getLinks.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId && Number.isInteger(projectId) && isAuthenticated }
  );

  const addLinkMutation = trpc.workspace.addLink.useMutation({
    onSuccess: () => {
      toast.success("Link added!");
      setLabel("");
      setUrl("");
      utils.workspace.getLinks.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to add link");
    },
  });

  const deleteLinkMutation = trpc.workspace.deleteLink.useMutation({
    onSuccess: () => {
      toast.success("Link deleted!");
      utils.workspace.getLinks.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete link");
    },
  });

  if (!projectId || !Number.isInteger(projectId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Workspace not found</h1>
          <p className="text-sm text-muted-foreground mb-4">The workspace you're looking for doesn't exist.</p>
          <Button asChild variant="outline" size="sm">
            <a href="/projects">Browse Projects</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Sign in required</h1>
          <p className="text-sm text-muted-foreground mb-4">You need to be signed in to access the workspace.</p>
          <Button size="sm" onClick={() => openSignIn()}>Sign in</Button>
        </div>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Project not found</h1>
          <p className="text-sm text-muted-foreground mb-4">This project doesn't exist or has been deleted.</p>
          <Button asChild variant="outline" size="sm">
            <a href="/projects">Browse Projects</a>
          </Button>
        </div>
      </div>
    );
  }

  const isMember = project.members?.some((m: { id: number }) => m.id === user?.id);
  const isOwner = project.ownerId === user?.id;

  if (!isMember && !isOwner) {
    toast.error("You need to be a team member to access the workspace");
    navigate(`/projects/${projectId}`);
    return null;
  }

  const handleAddLink = () => {
    if (!label.trim() || !url.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }
    addLinkMutation.mutate({ projectId, label, url });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{project.title} — Team Workspace</h1>
        </div>

        {/* What this page is for */}
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4 mb-8">
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">This is your team's home base.</span>{" "}
            Post the links your team needs in one place — your communication channel
            (Discord, WhatsApp, Telegram), shared docs (Google Drive, Notion), your
            GitHub repo, Figma files, anything. New members land here first, so a
            good first link is your group chat invite.
          </p>
        </div>

        {/* Add Link Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Add a Team Link</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Label</label>
                <Input
                  placeholder="e.g., Google Drive, GitHub Repo, Discord"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={addLinkMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">URL</label>
                <Input
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={addLinkMutation.isPending}
                  type="url"
                />
              </div>
            </div>
            <Button onClick={handleAddLink} disabled={addLinkMutation.isPending} className="gap-2">
              <Plus className="h-4 w-4" />
              {addLinkMutation.isPending ? "Adding..." : "Add Link"}
            </Button>
          </div>
        </Card>

        {/* Links List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Team Links ({links.length})</h2>

          {linksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
              <ExternalLink className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">No links yet</p>
              <p className="text-sm text-muted-foreground">
                Start with your team's communication channel — drop your Discord or
                WhatsApp invite link above so everyone knows where to talk.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <Card key={link.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 mb-1"
                    >
                      {link.label}
                      <ExternalLink className="h-4 w-4 shrink-0" />
                    </a>
                    <p className="text-xs text-muted-foreground">Added by {link.addedByName}</p>
                  </div>
                  {(isOwner || link.addedByUserId === user?.id) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete link?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove "{link.label}" from the team workspace.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteLinkMutation.mutate({ linkId: link.id })}
                            disabled={deleteLinkMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteLinkMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
