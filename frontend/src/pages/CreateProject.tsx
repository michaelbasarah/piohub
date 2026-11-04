import NavBar from "@/components/NavBar";
import ProjectForm, { type ProjectFormValues } from "@/components/ProjectForm";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlusCircle, ArrowLeft, Rocket } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function CreateProject() {
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const [, navigate] = useLocation();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: ({ id }) => {
      toast.success("Project created! Share it with the community.");
      navigate(`/projects/${id}`);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create project");
    },
  });

  const handleSubmit = (values: ProjectFormValues) => {
    createMutation.mutate(values);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <Rocket className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to post a project</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to create a project.
            </p>
            <Button onClick={() => openSignIn()}>Sign in</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      <main className="flex-1 py-10">
        <div className="container max-w-2xl page-enter">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
              Post a Project
            </h1>
            <p className="text-muted-foreground">
              Share your idea and find the right collaborators.
            </p>
          </div>

          <ProjectForm
            onSubmit={handleSubmit}
            isPending={createMutation.isPending}
            submitLabel="Post Project"
            pendingLabel="Creating..."
            submitIcon={<PlusCircle className="h-4 w-4" />}
            cancelHref="/projects"
          />
        </div>
      </main>
    </div>
  );
}
