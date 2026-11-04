import { Card, CardContent, CardHeader } from "@/components/ui/card";
import RoleTag from "./RoleTag";
import { Users, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface ProjectCardProps {
  id: number;
  title: string;
  description: string;
  neededRoles: string[];
  memberCount: number;
  maxTeamSize: number;
  ownerName?: string | null;
  createdAt?: Date;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ProjectCard({
  id,
  title,
  description,
  neededRoles,
  memberCount,
  maxTeamSize,
  ownerName,
  createdAt,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`}>
      <Card className="group h-full flex flex-col cursor-pointer border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
          </div>
          <div className="flex items-center justify-between gap-2">
            {ownerName && (
              <p className="text-xs text-muted-foreground">by {ownerName}</p>
            )}
            {createdAt && (
              <p className="text-xs text-muted-foreground text-right">
                posted {getRelativeTime(createdAt)}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {description}
          </p>
          <div className="mt-auto space-y-3">
            {neededRoles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {neededRoles.slice(0, 4).map((role) => (
                  <RoleTag key={role} role={role} />
                ))}
                {neededRoles.length > 4 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{neededRoles.length - 4} more
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                {memberCount} / {maxTeamSize} members
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
