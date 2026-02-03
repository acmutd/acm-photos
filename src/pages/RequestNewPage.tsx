import * as React from 'react';
import {useNavigate} from 'react-router-dom';
import {DIVISIONS} from '@/features/requests/divisions';
import {useCreateRequest} from '@/features/requests/hooks';
import type {Division} from '@/features/requests/types';

export function RequestNewPage() {
    const navigate = useNavigate();
    const create = useCreateRequest();

    const [division, setDivision] = React.useState<Division>('Development');
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [dateNeededBy, setDateNeededBy] = React.useState('');

    const [attachmentLinks, setAttachmentLinks] = React.useState<string[]>(['']);
    const [pickedFiles, setPickedFiles] = React.useState<File[]>([]); // mock only

    function setLink(idx: number, val: string) {
        setAttachmentLinks((prev) => prev.map((x, i) => (i === idx ? val : x)));
    }

    function addLink() {
        setAttachmentLinks((prev) => [...prev, '']);
    }

    function removeLink(idx: number) {
        setAttachmentLinks((prev) => prev.filter((_, i) => i !== idx));
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const cleaned = attachmentLinks.map((x) => x.trim()).filter(Boolean);

        const res = await create.mutateAsync({
            division,
            title: title.trim(),
            description: description.trim(),
            dateNeededBy: dateNeededBy.trim() || undefined,
            attachmentLinks: cleaned,
        });

        navigate(`/requests/${res.item.id}`);
    }

    const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !create.isPending;

    return (
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
            <h1 className="text-2xl font-semibold">New request</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Tell Media what you need and attach context links.
            </p>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <label className="text-xs text-muted-foreground">Division</label>
                    <select
                        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={division}
                        onChange={(e) => setDivision(e.target.value as Division)}
                    >
                        {DIVISIONS.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <label className="text-xs text-muted-foreground">Title</label>
                    <input
                        className="mt-2 h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="e.g., Instagram post for next workshop"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <label className="text-xs text-muted-foreground">Description</label>
                    <textarea
                        className="mt-2 min-h-[140px] w-full resize-none rounded-md border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="What is it for, due date, size/platform, copy text, references, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <label className="text-xs text-muted-foreground">Date needed by (optional)</label>
                    <input
                        type="date"
                        className="mt-2 h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={dateNeededBy}
                        onChange={(e) => setDateNeededBy(e.target.value)}
                    />
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground">Attachments (links)</label>
                        <button
                            type="button"
                            onClick={addLink}
                            className="text-xs text-muted-foreground hover:text-foreground transition"
                        >
                            Add link
                        </button>
                    </div>

                    <div className="mt-2 flex flex-col gap-2">
                        {attachmentLinks.map((val, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    placeholder="https://..."
                                    value={val}
                                    onChange={(e) => setLink(idx, e.target.value)}
                                />
                                {attachmentLinks.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeLink(idx)}
                                        className="h-10 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground hover:text-foreground transition"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-border pt-4">
                        <label className="text-xs text-muted-foreground">Files (mock for now)</label>
                        <input
                            type="file"
                            multiple
                            className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-xs file:text-foreground"
                            onChange={(e) => setPickedFiles(Array.from(e.target.files ?? []))}
                        />
                        {pickedFiles.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                Selected: {pickedFiles.map((f) => f.name).join(', ')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/requests')}
                        className="h-10 rounded-md border border-border bg-background px-4 text-sm text-foreground hover:bg-secondary transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="h-10 rounded-md bg-acm-gradient px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                        {create.isPending ? 'Submitting…' : 'Submit request'}
                    </button>
                </div>

                {create.isError && (
                    <div className="text-sm text-muted-foreground">
                        Failed to submit. Try again.
                    </div>
                )}
            </form>
        </div>
    );
}
