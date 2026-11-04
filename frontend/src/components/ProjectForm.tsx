import RoleTag from "@/components/RoleTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "wouter";

const SUGGESTED_ROLES = [
  "Frontend",
  "Backend",
  "Designer",
  "UI/UX",
  "Data Science",
  "ML",
  "DevOps",
  "Mobile",
  "Product Manager",
  "Research",
  "Marketing",
];

export interface ProjectFormValues {
  title: string;
  description: string;
  neededRoles: string[];
  maxTeamSize: number;
}

interface ProjectFormProps {
  initialValues?: ProjectFormValues;
  onSubmit: (values: ProjectFormValues) => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  submitIcon?: ReactNode;
  cancelHref: string;
}

export default function ProjectForm({
  initialValues,
  onSubmit,
  isPending,
  submitLabel,
  pendingLabel,
  submitIcon,
  cancelHref,
}: ProjectFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [roles, setRoles] = useState<string[]>(initialValues?.neededRoles ?? []);
  const [roleInput, setRoleInput] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState<number | "">(initialValues?.maxTeamSize ?? 5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (!trimmed) return;
    if (roles.length >= 10) {
      toast.error("Maximum 10 roles allowed");
      return;
    }
    if (!roles.some((r) => r.toLowerCase() === trimmed.toLowerCase())) {
      setRoles((prev) => [...prev, trimmed]);
    }
    setRoleInput("");
  };

  const removeRole = (role: string) => {
    setRoles((prev) => prev.filter((r) => r !== role));
  };

  const handleRoleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRole(roleInput);
    }
    if (e.key === "Backspace" && !roleInput && roles.length > 0) {
      setRoles((prev) => prev.slice(0, -1));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (title.trim().length < 3) errs.title = "Title must be at least 3 characters";
    if (description.trim().length < 10) errs.description = "Description must be at least 10 characters";
    if (roles.length === 0) errs.roles = "Add at least one needed role";
    if (maxTeamSize === "" || maxTeamSize < 2 || maxTeamSize > 20) errs.maxTeamSize = "Team size must be between 2 and 20";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      neededRoles: roles,
      maxTeamSize: Number(maxTeamSize),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Project Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g. AI-powered study planner"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={errors.title ? "border-destructive" : ""}
          maxLength={255}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your project — what problem does it solve? What's the tech stack? What stage are you at?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className={`resize-none ${errors.description ? "border-destructive" : ""}`}
          maxLength={5000}
        />
        <div className="flex justify-between">
          {errors.description ? (
            <p className="text-xs text-destructive">{errors.description}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-muted-foreground">{description.length}/5000</p>
        </div>
      </div>

      {/* Needed Roles */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Needed Roles <span className="text-destructive">*</span>
        </Label>

        <div
          className={`flex flex-wrap gap-2 min-h-[44px] rounded-md border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring transition-shadow ${
            errors.roles ? "border-destructive" : "border-input"
          }`}
        >
          {roles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-medium"
            >
              {role}
              <button
                type="button"
                onClick={() => removeRole(role)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={roles.length === 0 ? "Type a role and press Enter..." : "Add more..."}
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            onKeyDown={handleRoleKeyDown}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        {errors.roles && <p className="text-xs text-destructive">{errors.roles}</p>}

        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center">Suggestions:</span>
          {SUGGESTED_ROLES.filter(
            (r) => !roles.some((existing) => existing.toLowerCase() === r.toLowerCase())
          ).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => addRole(role)}
              className="px-2.5 py-0.5 rounded-full border border-dashed border-border text-xs text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
            >
              + {role}
            </button>
          ))}
        </div>
      </div>

      {/* Max Team Size */}
      <div className="space-y-2">
        <Label htmlFor="maxTeamSize" className="text-sm font-medium">
          Maximum Team Size <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="maxTeamSize"
            type="number"
            min={2}
            max={20}
            value={maxTeamSize}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return setMaxTeamSize("");
              const n = parseInt(v, 10);
              setMaxTeamSize(Number.isNaN(n) ? "" : n);
            }}
            className={`w-24 ${errors.maxTeamSize ? "border-destructive" : ""}`}
          />
          <span className="text-sm text-muted-foreground">people (including you)</span>
        </div>
        {errors.maxTeamSize && <p className="text-xs text-destructive">{errors.maxTeamSize}</p>}
      </div>

      {/* Preview */}
      {roles.length > 0 && (
        <div className="rounded-lg border border-border bg-secondary/20 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Role preview
          </p>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <RoleTag key={role} role={role} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="gap-2 flex-1 sm:flex-none sm:px-8">
          {isPending ? (
            pendingLabel
          ) : (
            <>
              {submitIcon}
              {submitLabel}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
