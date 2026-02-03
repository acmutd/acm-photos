import {api} from '@/lib/api';
import type {Division, RequestTicket, RequestStatus} from './types';

export type CreateRequestInput = {
    division: Division;
    title: string;
    description: string;
    dateNeededBy?: string;
    attachmentLinks: string[];
};

export type ListRequestsParams = {
    status?: RequestStatus | 'all';
    division?: Division | 'all';
};

export async function listRequests() {
  return api<{ items: RequestTicket[] }>('/api/requests');
}

export async function createRequest(input: CreateRequestInput) {
    return api<{ item: RequestTicket }>('/api/requests', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function getRequest(id: string) {
  const { items } = await listRequests();
  const item = items.find((x) => x.id === id);
  if (!item) throw new Error('Not found');
  return { item };
}

export async function updateRequest(id: string, patch: Partial<RequestTicket>) {
    return api<{ item: RequestTicket }>(`/api/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
}
