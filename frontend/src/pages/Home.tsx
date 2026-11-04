import { useAuth } from "@/hooks/useAuth";
import { useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import {
  Users,
  Layers,
  Rocket,
  Star,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Code2,
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: Layers,
    title: "Post the idea you keep thinking about",
    description:
      "Write it down, say who you need. That already counts as starting — the team comes to you.",
  },
  {
    icon: Users,
    title: "Join with what you have",
    description:
      "Designer, coder, writer, organizer. Every project needs more than one kind of mind — bring yours.",
  },
  {
    icon: Rocket,
    title: "Build with committed people",
    description:
      "Owners approve who joins, so teams are made of people who actually want to be there.",
  },
  {
    icon: Star,
    title: "Finish things you can point to",
    description:
      "Every project lives on your profile. Proof that you don't just plan — you try.",
  },
];

const roles = [
  { label: "Frontend", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "Backend", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { label: "Designer", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { label: "Data Science", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { label: "DevOps", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { label: "Mobile", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { label: "Product Manager", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "Research", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container text-center max-w-3xl mx-auto page-enter">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <GraduationCap className="h-4 w-4" />
            For students who want to build
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
            Start something.{" "}
            <span className="text-primary">Or join someone who did.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            You don't need a perfect plan — that's what the team is for. pioHub
            connects students with complementary skills and the same commitment,
            so every idea gets the people it needs and every builder gets a
            place to start.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Button asChild size="lg" className="gap-2 px-8">
                  <Link href="/projects/new">
                    <Rocket className="h-4 w-4" />
                    Start a project
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 px-8">
                  <Link href="/projects">
                    Join a project
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="gap-2 px-8" onClick={() => openSignIn({ forceRedirectUrl: "/projects/new", signUpForceRedirectUrl: "/projects/new" })}>
                  Start a project
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2 px-8">
                  <Link href="/projects">Join a project</Link>
                </Button>
              </>
            )}
          </div>

          {/* Role tags showcase */}
          <div className="mt-14 flex flex-wrap justify-center gap-2">
            {roles.map((r) => (
              <span
                key={r.label}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${r.color}`}
              >
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-secondary/30 py-8">
        <div className="container">
          <div className="grid grid-cols-3 gap-8 text-center max-w-lg mx-auto">
            {[
              { value: "1 idea", label: "is enough to start" },
              { value: "2 min", label: "from idea to posted project" },
              { value: "$0", label: "free for every student" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Made for starting
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Every part of pioHub exists to shrink the gap between "I have an
              idea" and "we're building it."
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-secondary/20 border-y border-border">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              How it works
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Code2,
                title: "Make a profile",
                desc: "Say what you can do and what you care about.",
              },
              {
                step: "02",
                icon: Briefcase,
                title: "Start or join",
                desc: "Post the idea you've been sitting on, or find one that needs you.",
              },
              {
                step: "03",
                icon: Users,
                title: "Build together",
                desc: "Meet your team, set up your workspace, make it real.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            What would you build if you had the team?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Find out. It's free, and starting takes two minutes.
          </p>
          {isAuthenticated ? (
            <Button asChild size="lg" className="gap-2 px-10">
              <Link href="/projects">
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" className="gap-2 px-10" onClick={() => openSignIn({ forceRedirectUrl: "/projects", signUpForceRedirectUrl: "/projects" })}>
              Start building
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="font-medium text-foreground">pioHub</span>
            <span>— Student Collaboration Platform</span>
          </div>
          <p>© {new Date().getFullYear()} pioNox. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
