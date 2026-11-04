import { useUser } from "@clerk/react";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { isLoaded, isSignedIn } = useUser();

  const { data: dbUser, isLoading: dbLoading } = trpc.auth.me.useQuery(undefined, {
    enabled: isSignedIn === true,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: dbUser ?? null,
    isAuthenticated: isSignedIn === true && !!dbUser,
    loading: !isLoaded || (isSignedIn === true && dbLoading),
  };
}
