import NavBar from "@/components/NavBar";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClerk } from "@clerk/react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  Lightbulb,
  ShieldAlert,
  Trash2,
  UserPlus,
} from "lucide-react";

const CHANNELS = ["IRL", "LinkedIn", "Reddit", "Other"];

type Contact = {
  id: number;
  name: string;
  channel: string | null;
  note: string | null;
  hasIdea: boolean;
  refCode: string;
  signedUp: boolean;
  posted: boolean;
};

function statusOf(c: Contact): { label: string; cls: string } {
  if (c.posted) return { label: "Posted", cls: "bg-green-50 text-green-700 border-green-200" };
  if (c.signedUp) return { label: "Signed up", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  return { label: "Contacted", cls: "bg-secondary text-muted-foreground border-border" };
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function AddContactForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("IRL");
  const [hasIdea, setHasIdea] = useState(false);
  const [note, setNote] = useState("");

  const addMutation = trpc.admin.outreach.add.useMutation({
    onSuccess: () => {
      toast.success("Contact added");
      setName("");
      setNote("");
      setHasIdea(false);
      onAdded();
    },
    onError: (err) => toast.error(err.message ?? "Failed to add contact"),
  });

  const submit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    addMutation.mutate({ name: name.trim(), channel, hasIdea, note: note.trim() || undefined });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        Add a contact
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah (CS, year 2)" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Where you reached them</label>
          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  channel === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-secondary/60"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's their idea? How do you know them?"
          rows={2}
          maxLength={500}
          className="resize-none"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setHasIdea((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
            hasIdea
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-background text-muted-foreground border-border hover:bg-secondary/60"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          {hasIdea ? "Has an idea" : "Mark: has an idea"}
        </button>
        <Button onClick={submit} disabled={addMutation.isPending} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          {addMutation.isPending ? "Adding..." : "Add contact"}
        </Button>
      </div>
    </div>
  );
}

function ContactRow({ contact, onDelete }: { contact: Contact; onDelete: (id: number) => void }) {
  const [copied, setCopied] = useState(false);
  const status = statusOf(contact);
  const link = `${window.location.origin}/?ref=${contact.refCode}`;

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{contact.name}</span>
            {contact.channel && (
              <Badge variant="secondary" className="text-xs">{contact.channel}</Badge>
            )}
            {contact.hasIdea && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <Lightbulb className="h-3 w-3" /> idea
              </span>
            )}
          </div>
          {contact.note && <p className="text-sm text-muted-foreground mt-1">{contact.note}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`border ${status.cls}`}>{status.label}</Badge>
          <button
            onClick={() => onDelete(contact.id)}
            className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
            aria-label="Delete contact"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <code className="flex-1 min-w-0 truncate rounded-md bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground">
          {link}
        </code>
        <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 shrink-0 h-8">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}

export default function OutreachPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openSignIn } = useClerk();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: contacts = [], isLoading } = trpc.admin.outreach.list.useQuery(undefined, {
    enabled: isAuthenticated && isAdmin,
  });

  const removeMutation = trpc.admin.outreach.remove.useMutation({
    onSuccess: () => {
      toast.success("Contact removed");
      utils.admin.outreach.list.invalidate();
    },
    onError: (err) => toast.error(err.message ?? "Failed to remove"),
  });

  if (loading || (isAuthenticated && isAdmin && isLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <NavBar />
        <main className="flex-1 py-10">
          <div className="container max-w-3xl space-y-6">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
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
            <p className="text-muted-foreground mb-6">This page is restricted to pioHub administrators.</p>
            {!isAuthenticated && <Button onClick={() => openSignIn()}>Sign in</Button>}
          </div>
        </main>
      </div>
    );
  }

  const total = contacts.length;
  const signedUp = contacts.filter((c) => c.signedUp).length;
  const posted = contacts.filter((c) => c.posted).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1 py-10">
        <div className="container max-w-3xl page-enter space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Analytics
              </Link>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Outreach tracker</h1>
              <p className="text-muted-foreground mt-1">
                Add each person you contact, send them their link, and watch who converts.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
              <Link href="/admin">
                <BarChart3 className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Funnel */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Contacted" value={total} />
            <StatTile label="Signed up" value={signedUp} />
            <StatTile label="Posted" value={posted} />
          </div>

          {/* Add form */}
          <AddContactForm onAdded={() => utils.admin.outreach.list.invalidate()} />

          {/* List */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Contacts ({total})
            </h2>
            {total === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
                <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">No contacts yet</p>
                <p className="text-sm text-muted-foreground">
                  Add the first person you're reaching out to above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <ContactRow
                    key={c.id}
                    contact={c}
                    onDelete={(id) => removeMutation.mutate({ id })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
