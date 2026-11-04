import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { trpc } from "@/lib/trpc";

const REF_KEY = "piohub_ref";

// Reads ?ref=<code> from the URL once and remembers it. When the visitor later
// signs in, we send the code to the backend so the outreach tracker can mark
// "this person came from the one we contacted." Cleared after one attempt.
export function useOutreachCapture() {
  const { isAuthenticated } = useAuth();
  const attribute = trpc.outreach.attribute.useMutation();
  const claimed = useRef(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem(REF_KEY, ref);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || claimed.current) return;
    const ref = localStorage.getItem(REF_KEY);
    if (!ref) return;
    claimed.current = true;
    attribute.mutate(
      { refCode: ref },
      { onSettled: () => localStorage.removeItem(REF_KEY) }
    );
  }, [isAuthenticated, attribute]);
}
