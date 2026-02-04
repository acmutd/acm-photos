import { api } from "@/lib/api";
import type { RequestTicket, RequestStatus, Division } from "./types";

export type ListRequestsParams = {
  status?: RequestStatus | "all";
  division?: Division | "all";
};

export type CreateRequestInput = {
  title: string;
  description: string;
  division: Division;
  dateNeededBy?: string;
  attachmentLinks?: string[];
};

export async function listRequests(params: ListRequestsParams = {}) {
  const sp = new URLSearchParams();

  if (params.status && params.status !== "all") {
    sp.set("status", params.status);
  }

  if (params.division && params.division !== "all") {
    sp.set("division", params.division);
  }

  const qs = sp.toString();
  const url = qs ? `/api/requests?${qs}` : "/api/requests";

  return api<{ items: RequestTicket[] }>(url);
}

export async function getRequest(id: string) {
  return api<{ item: RequestTicket }>(`/api/requests/${id}`);
}

export async function createRequest(input: CreateRequestInput) {
  return api<{ item: RequestTicket }>("/api/requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRequest(id: string, patch: Partial<RequestTicket>) {
  return api<{ item: RequestTicket }>(`/api/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
