import NavBar from "@/components/NavBar";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import { PlusCircle, Search, Layers, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";

const COMMON_ROLES = [
  "Frontend",
  "Backend",
  "Designer",
  "Data Science",
  "DevOps",
  "Mobile",
  "Product Manager",
  "Research",
];

export default function Feed() {
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        !selectedRole ||
        p.neededRoles.some((r: string) =>
          r.toLowerCase().includes(selectedRole.toLowerCase())
        );
      return matchesSearch && matchesRole;
    });
  }, [projects, search, selectedRole]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      <main className="flex-1 py-10">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Open Projects
              </h1>
              <p className="text-muted-foreground mt-1">
                {projects ? `${projects.length} ${projects.length === 1 ? "project" : "projects"} looking for collaborators` : "Browse student projects"}
              </p>
            </div>
            {isAuthenticated ? (
              <Button asChild className="gap-2 shrink-0">
                <Link href="/projects/new">
                  <PlusCircle className="h-4 w-4" />
                  Post a Project
                </Link>
              </Button>
            ) : (
              <Button className="gap-2 shrink-0" onClick={() => openSignIn()}>
                Sign in to Post
              </Button>
            )}
          </div>

          {/* Search & Filter */}
          <div className="space-y-4 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground font-medium">Filter by role:</span>
              {COMMON_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(selectedRole === role ? null : role)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedRole === role
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  {role}
                </button>
              ))}
              {selectedRole && (
                <button
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-6 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {search || selectedRole ? "No matching projects" : "No projects yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {search || selectedRole
                  ? "Try adjusting your search or filters."
                  : "Be the first to post a project!"}
              </p>
              {isAuthenticated && (
                <Button asChild>
                  <Link href="/projects/new">Post the first project</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  description={project.description}
                  neededRoles={project.neededRoles}
                  memberCount={project.memberCount}
                  maxTeamSize={project.maxTeamSize}
                  ownerName={project.owner?.name}
                  createdAt={project.createdAt ? new Date(project.createdAt) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
