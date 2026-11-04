import NavBar from "@/components/NavBar";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useClerk } from "@clerk/react";
import {
  Activity,
  GraduationCap,
  Handshake,
  RefreshCw,
  Scale,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

// ─── Small building blocks ──────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  question,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  question: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{question}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function TrendBars({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${d.date}: ${d.count}`}>
          <div
            className="w-full rounded-sm bg-primary/70"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function BreakdownList({
  rows,
  emptyLabel,
}: {
  rows: { label: string; count: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-foreground">{r.label}</span>
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary/70" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums text-muted-foreground">
            {r.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Formatting helpers ─────────────────────────────────────────────────────────

const fmtDuration = (hours: number | null): string => {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours >= 48) return `${Math.round(hours / 24)}d`;
  return `${hours}h`;
};

const fmtDelta = (current: number, prev: number): string => {
  const diff = current - prev;
  if (diff === 0) return "same as last week";
  return `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)} vs last week`;
};

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openSignIn } = useClerk();
  const isAdmin = user?.role === "admin";

  const { data, isLoading, isFetching, refetch } = trpc.admin.overview.useQuery(undefined, {
    enabled: isAuthenticated && isAdmin,
  });

  if (loading || (isAuthenticated && isAdmin && isLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 py-10">
          <div className="container max-w-5xl space-y-6">
            <Skeleton className="h-9 w-48" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
              <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Admins only</h2>
            <p className="text-muted-foreground mb-6">
              This page is restricted to pioHub administrators.
            </p>
            {!isAuthenticated && <Button onClick={() => openSignIn()}>Sign in</Button>}
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { totals, growth, activation, loop, engagement, marketplace, quality } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1 py-10">
        <div className="container max-w-5xl page-enter space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Updated {new Date(data.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/admin/outreach">
                  <UserPlus className="h-3.5 w-3.5" />
                  Outreach
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* The 5 numbers that matter */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              The 5 that matter most
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatTile accent label="Signups / wk" value={growth.signupsThisWeek} hint={fmtDelta(growth.signupsThisWeek, growth.signupsPrevWeek)} />
              <StatTile accent label="Activation" value={`${activation.activationRate}%`} hint="post/req in 7d" />
              <StatTile accent label="Projects w/ req" value={`${loop.projectsWithRequestsRate}%`} hint="have demand" />
              <StatTile accent label="Response rate" value={`${loop.responseRate}%`} hint="owners reply" />
              <StatTile accent label="Teams formed" value={totals.teamsFormed} hint="≥1 teammate" />
            </div>
          </div>

          {/* Q1 — Growth */}
          <Section icon={TrendingUp} title="Growth" question="Is the app growing?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <StatTile label="Total signups" value={totals.users} />
              <StatTile label="New this week" value={growth.signupsThisWeek} hint={fmtDelta(growth.signupsThisWeek, growth.signupsPrevWeek)} />
              <StatTile label="Total projects" value={totals.projects} hint={`${totals.openProjects} open`} />
              <StatTile label="Projects / wk" value={growth.projectsThisWeek} hint={fmtDelta(growth.projectsThisWeek, growth.projectsPrevWeek)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Signups · last 14 days</p>
                <TrendBars data={growth.signupsByDay} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Projects posted · last 14 days</p>
                <TrendBars data={growth.projectsByDay} />
              </div>
            </div>
          </Section>

          {/* Q2 — Activation */}
          <Section icon={Zap} title="Activation" question="Are new people actually using it, or signing up and vanishing?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile label="Activation rate" value={`${activation.activationRate}%`} hint={`${activation.activatedUsers} of ${totals.users}`} />
              <StatTile label="Profile complete" value={`${activation.profileCompletionRate}%`} hint="skills + bio" />
              <StatTile label="Did nothing" value={activation.lurkers} hint="no post/req/join" />
              <StatTile label="Active users" value={activation.activatedUsers} hint="took an action" />
            </div>
          </Section>

          {/* Q3 — Core loop */}
          <Section icon={Workflow} title="Core loop" question="Does the core thing work — do teams actually form?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatTile label="Projects w/ request" value={`${loop.projectsWithRequestsRate}%`} hint={`${loop.projectsWithRequests} projects`} />
              <StatTile label="Owner response rate" value={`${loop.responseRate}%`} hint={`${loop.responded} of ${loop.responded + loop.pending}`} />
              <StatTile label="Avg time to respond" value={fmtDuration(loop.avgResponseHours)} hint="request → reply" />
              <StatTile label="Time to 1st teammate" value={fmtDuration(loop.avgTimeToFirstTeammateHours)} hint="post → 1st join" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile label="Pending" value={loop.pending} />
              <StatTile label="Approved" value={loop.approved} />
              <StatTile label="Rejected" value={loop.rejected} />
              <StatTile label="Approval rate" value={`${loop.approvalRate}%`} hint="of those decided" />
            </div>
          </Section>

          {/* Q4 — Engagement */}
          <Section icon={Activity} title="Engagement" question="Is it a living place or a graveyard?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile label="Active · 7 days" value={engagement.active7} hint={`of ${totals.users}`} />
              <StatTile label="Active · 30 days" value={engagement.active30} hint={`of ${totals.users}`} />
              <StatTile label="Teams working" value={engagement.teamsWithWorkspace} hint="added workspace link" />
              <StatTile label="Closed projects" value={totals.closedProjects} />
            </div>
          </Section>

          {/* Q5 — Marketplace */}
          <Section icon={Scale} title="Marketplace balance" question="Is supply (owners) keeping up with demand (joiners)?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatTile label="Owners (supply)" value={marketplace.owners} />
              <StatTile label="Joiners (demand)" value={marketplace.joiners} />
              <StatTile label="Owner : joiner" value={marketplace.ownerToJoinerRatio ?? "—"} hint="higher = more supply" />
              <StatTile label="Open spots" value={marketplace.openSpots} hint={`${marketplace.avgFillRate}% avg fill`} />
            </div>
          </Section>

          {/* Q6 — Quality */}
          <Section icon={GraduationCap} title="Audience quality" question="Are these our actual target users?">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Universities (top 8)
                </p>
                <BreakdownList
                  rows={quality.universityBreakdown.map((u) => ({ label: u.university, count: u.count }))}
                  emptyLabel="No universities set on profiles yet."
                />
              </div>
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Handshake className="h-3.5 w-3.5" /> Most-requested roles
                </p>
                <BreakdownList
                  rows={quality.topRoles.map((r) => ({ label: r.role, count: r.count }))}
                  emptyLabel="No roles posted yet."
                />
              </div>
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}
