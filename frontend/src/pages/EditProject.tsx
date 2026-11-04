import NavBar from "@/components/NavBar";
import ProjectForm, { type ProjectFormValues } from "@/components/ProjectForm";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ? parseInt(id, 10) : null;
  const { user: currentUser, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: project, isLoading, error } = trpc.projects.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId && Number.isInteger(projectId) }
  );

  const updateMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated");
      utils.projects.getById.invalidate({ id: projectId! });
      utils.projects.list.invalidate();
      utils.dashboard.myData.invalidate();
      navigate(`/projects/${projectId}`);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update project");
    },
  });

  const handleSubmit = (values: ProjectFormValues) => {
    if (!projectId) return;
    updateMutation.mutate({ id: projectId, ...values });
  };

  const notFound = (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-foreground mb-2">Project not found</h1>
        <p className="text-sm text-muted-foreground mb-4">
          This project doesn't exist or has been removed.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );

  if (!projectId || !Number.isInteger(projectId)) return notFound;

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 py-10">
          <div className="container max-w-2xl space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) return notFound;

  if (!currentUser || currentUser.id !== project.ownerId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-foreground mb-2">Not your project</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Only the project owner can edit this project.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}`}>View project</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      <main className="flex-1 py-10">
        <div className="container max-w-2xl page-enter">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to project
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Edit Project</h1>
            <p className="text-muted-foreground">Update your project details and needed roles.</p>
          </div>

          <ProjectForm
            initialValues={{
              title: project.title,
              description: project.description,
              neededRoles: project.neededRoles,
              maxTeamSize: project.maxTeamSize,
            }}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
            submitLabel="Save Changes"
            pendingLabel="Saving..."
            submitIcon={<Save className="h-4 w-4" />}
            cancelHref={`/projects/${projectId}`}
          />
        </div>
      </main>
    </div>
  );
}
