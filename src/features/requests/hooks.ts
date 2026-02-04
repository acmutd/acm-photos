import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRequestInput, ListRequestsParams } from "./api";
import { createRequest, getRequest, listRequests, updateRequest } from "./api";
import type { RequestTicket } from "./types";

export function useRequests(params: ListRequestsParams = {}) {
  return useQuery({
    queryKey: ["requests", params],
    queryFn: () => listRequests(params),
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: () => getRequest(id),
    enabled: !!id,
  });
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRequestInput) => createRequest(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}

type UpdateRequestPatch = Partial<
  Pick<RequestTicket, "status" | "deliverableFolderId" | "notes">
>;

export function useUpdateRequest(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateRequestPatch) => updateRequest(id, patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["request", id] });
      await qc.invalidateQueries({ queryKey: ["requests"] });
    },
  });
}
