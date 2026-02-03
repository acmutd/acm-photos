import * as React from 'react';
import {Link} from 'react-router-dom';

import {DIVISIONS} from '@/features/requests/divisions';
import {useRequests} from '@/features/requests/hooks';
import type {Division, RequestStatus} from '@/features/requests/types';

const STATUS_OPTIONS: Array<RequestStatus | 'all'> = ['all', 'open', 'in_progress', 'done'];

function isRequestStatus(val: string): val is RequestStatus | 'all' {
    return (STATUS_OPTIONS as string[]).includes(val);
}

function isDivision(val: string): val is Division | 'all' {
    return val === 'all' || (DIVISIONS as readonly string[]).includes(val);
}

export function RequestsPage() {
    const [status, setStatus] = React.useState<RequestStatus | 'all'>('all');
    const [division, setDivision] = React.useState<Division | 'all'>('all');

    const q = useRequests({status, division});
    const items = q.data?.items ?? [];

    return (
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Requests</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Submit design/media requests and track delivery.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Link
                        to="/requests/new"
                        className="rounded-md bg-acm-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        New request
                    </Link>
                </div>
            </div>

            <div
                className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={status}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (isRequestStatus(v)) setStatus(v);
                        }}
                    >
                        <option value="all">All</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Division</span>
                    <select
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        value={division}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (isDivision(v)) setDivision(v);
                        }}
                    >
                        <option value="all">All</option>
                        {DIVISIONS.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-6">
                {q.isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                ) : q.isError ? (
                    <div className="text-sm text-muted-foreground">Failed to load requests.</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No requests yet.</div>
                ) : (
                    <div className="grid gap-3">
                        {items.map((r) => (
                            <Link
                                key={r.id}
                                to={`/requests/${r.id}`}
                                className="rounded-xl border border-border bg-card p-4 transition hover:bg-secondary/40"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-semibold">{r.title}</div>
                                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-border bg-background px-2 py-0.5">
                        {r.division}
                      </span>
                                            <span
                                                className="rounded-full border border-border bg-background px-2 py-0.5">
                        {r.status.replace('_', ' ')}
                      </span>
                                            <span className="truncate">{r.createdByEmail}</span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
