import { useQuery } from "@tanstack/react-query";
import { getDriveTree } from "./api";

export function useDriveTree() {
  return useQuery({
    queryKey: ["driveTree"],
    queryFn: getDriveTree,
  });
}
