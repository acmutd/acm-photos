import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Me = { email: string };

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/api/me"),
    retry: false,
  });
}
