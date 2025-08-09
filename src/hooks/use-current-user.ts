import { useMemo, useState } from "react";

export function useCurrentUser() {
  const [name] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("currentUserName");
      return stored && stored.trim() ? stored : "Felipe";
    } catch {
      return "Felipe";
    }
  });

  // In a real app, you could also expose id, role, etc.
  return useMemo(() => ({ name }), [name]);
}
