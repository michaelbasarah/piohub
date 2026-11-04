import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import NavBar from "@/components/NavBar";
import RoleTag from "@/components/RoleTag";
import { Link } from "wouter";
import {
  ExternalLink,
  GraduationCap,
  Briefcase,
  Users,
  AlertCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id, 10) : null;
  const { user: currentUser } = useAuth();

  const { data: profile, isLoading, error } = trpc.profile.getPublic.useQuery(
    { userId: userId! },
    { enabled: !!userId && Number.isInteger(userId) }
  );

  if (!userId || !Number.isInteger(userId)) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center p-4 py-24">
          <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground mb-2">Profile not found</h1>
            <p className="text-sm text-muted-foreground mb-4">The user profile you're looking for doesn't exist.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Browse Projects</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex items-center justify-center p-4 py-24">
          <div className="rounded-xl border border-border bg-card p-8 text-center max-w-md">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-lg font-semibold text-foreground mb-2">Profile not found</h1>
            <p className="text-sm text-muted-foreground mb-4">This user profile doesn't exist or has been removed.</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Browse Projects</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const neededRoles = (roles: unknown) =>
    Array.isArray(roles) ? roles : (typeof roles === "string" ? JSON.parse(roles) : []) as string[];

  const ownedCount = profile.ownedProjects?.length ?? 0;
  const joinedCount = profile.joinedProjects?.length ?? 0;
  const isOwnProfile = currentUser?.id === profile.id;
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const stats = [
    { icon: Briefcase, value: ownedCount, label: ownedCount === 1 ? "Project created" : "Projects created" },
    { icon: Users, value: joinedCount, label: joinedCount === 1 ? "Team joined" : "Teams joined" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 page-enter">
        {/* Header Card with banner */}
        <Card className="overflow-hidden p-0 mb-6">
          {/* Navy banner */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-primary via-primary to-primary/80 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, oklch(0.78 0.12 75 / 0.6), transparent 50%)" }} />
          </div>

          <div className="relative px-6 sm:px-8 pb-6 sm:pb-8">
            {/* Avatar overlapping banner */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-bold ring-4 ring-background shadow-lg border-2 border-accent">
                {initials(profile.name)}
              </div>
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard">Edit Profile</Link>
                </Button>
              )}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              {profile.name || "Unknown User"}
              {isOwnProfile && <span className="text-base font-normal text-muted-foreground ml-2">(you)</span>}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-5">
              {profile.university && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {profile.university}
                </span>
              )}
              {memberSince && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Member since {memberSince}
                </span>
              )}
            </div>

            {profile.bio ? (
              <p className="text-foreground mb-5 leading-relaxed">{profile.bio}</p>
            ) : (
              isOwnProfile && (
                <p className="text-sm text-muted-foreground italic mb-5">
                  No bio yet — <Link href="/dashboard" className="text-primary underline underline-offset-2">add one</Link> so teammates know what you're about.
                </p>
              )
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.portfolioLink && (
              <a
                href={profile.portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <span>View Portfolio</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </Card>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 sm:p-5 text-center">
              <stat.icon className="h-5 w-5 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Owned Projects */}
        {profile.ownedProjects && profile.ownedProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                {isOwnProfile ? "Your Projects" : "Their Projects"} ({profile.ownedProjects.length})
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {profile.ownedProjects.map((project) => {
                const roles = neededRoles(project.neededRoles);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {roles.slice(0, 2).map((role: string) => (
                          <RoleTag key={role} role={role} />
                        ))}
                        {roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{roles.length - 2}</Badge>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Joined Projects */}
        {profile.joinedProjects && profile.joinedProjects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-foreground" />
              <h2 className="text-xl font-semibold text-foreground">
                {isOwnProfile ? "Teams You're On" : "Teams They're On"} ({profile.joinedProjects.length})
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {profile.joinedProjects.map((project) => {
                const roles = neededRoles(project.neededRoles);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="p-4 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {roles.slice(0, 2).map((role: string) => (
                          <RoleTag key={role} role={role} />
                        ))}
                        {roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{roles.length - 2}</Badge>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {ownedCount === 0 && joinedCount === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">
              {isOwnProfile ? "You haven't joined any projects yet" : "No projects yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              {isOwnProfile
                ? "Your profile is your portfolio — start a project or join a team to fill it up."
                : `${profile.name?.split(" ")[0] || "This user"} hasn't created or joined any projects yet.`}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="sm" className="gap-2">
                <Link href="/projects">
                  Browse Projects
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects/new">Post a Project</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
