import {api} from '@/lib/api';
import type {Division, RequestTicket, RequestStatus} from './types';

export type CreateRequestInput = {
    division: Division;
    title: string;
    description: string;
    attachmentLinks: string[];
};

export type ListRequestsParams = {
    status?: RequestStatus | 'all';
    division?: Division | 'all';
};

export async function listRequests(params: ListRequestsParams = {}) {
    const sp = new URLSearchParams();
    if (params.status && params.status !== 'all') sp.set('status', params.status);
    if (params.division && params.division !== 'all') sp.set('division', params.division);
    const qs = sp.toString();
    return api<{ items: RequestTicket[] }>(`/api/requests${qs ? `?${qs}` : ''}`);
}

export async function createRequest(input: CreateRequestInput) {
    return api<{ item: RequestTicket }>('/api/requests', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function getRequest(id: string) {
    return api<{ item: RequestTicket }>(`/api/requests/${id}`);
}

export async function updateRequest(id: string, patch: Partial<RequestTicket>) {
    return api<{ item: RequestTicket }>(`/api/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
}
