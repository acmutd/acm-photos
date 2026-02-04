import { useQuery } from "@tanstack/react-query";

type DriveFolder = { id: string; name: string; parentId: string | null };
type DriveTreeResponse = { rootId: string; folders: DriveFolder[] };

async function getDriveTree(): Promise<DriveTreeResponse> {
  const r = await fetch("/api/drive/tree");
  if (!r.ok) throw new Error("Failed to load drive tree");
  return r.json();
}

export function useDriveTree() {
  return useQuery({
    queryKey: ["driveTree"],
    queryFn: getDriveTree,
  });
}

export type { DriveFolder };
