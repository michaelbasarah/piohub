import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  frontend: "bg-blue-50 text-blue-700 border-blue-200",
  backend: "bg-violet-50 text-violet-700 border-violet-200",
  designer: "bg-pink-50 text-pink-700 border-pink-200",
  "ui/ux": "bg-pink-50 text-pink-700 border-pink-200",
  "data science": "bg-emerald-50 text-emerald-700 border-emerald-200",
  ml: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "machine learning": "bg-emerald-50 text-emerald-700 border-emerald-200",
  devops: "bg-orange-50 text-orange-700 border-orange-200",
  mobile: "bg-cyan-50 text-cyan-700 border-cyan-200",
  "product manager": "bg-amber-50 text-amber-700 border-amber-200",
  pm: "bg-amber-50 text-amber-700 border-amber-200",
  marketing: "bg-rose-50 text-rose-700 border-rose-200",
  research: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function getRoleColor(role: string) {
  return ROLE_COLORS[role.toLowerCase()] ?? "bg-secondary text-secondary-foreground border-border";
}

interface RoleTagProps {
  role: string;
  className?: string;
  size?: "sm" | "md";
}

export default function RoleTag({ role, className, size = "sm" }: RoleTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        getRoleColor(role),
        className
      )}
    >
      {role}
    </span>
  );
}
