import * as React from 'react';
import {Link, useSearchParams} from 'react-router-dom';

import {FolderTree} from '@/components/FolderTree';
import {useMediaSearch, type MediaSearchQuery} from '@/features/media/useMediaSearch';
import {useDriveTree} from '@/features/drive/useDriveTree';
import {buildCrumbs} from '@/features/drive/buildCrumbs';

const SUGGESTED_TAGS = ['hackutd', 'acm', 'event', 'branding', 'flyer', '2026'];

export function MediaPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const tree = useDriveTree();
    const rootId = tree.data?.rootId ?? null;
    const folders = tree.data?.folders ?? [];

    const folderParam = searchParams.get('folder');

    const effectiveFolderId = React.useMemo(() => {
        if (folderParam) return folderParam;
        if (rootId) return rootId;
        return null;
    }, [folderParam, rootId]);

    const [q, setQ] = React.useState<MediaSearchQuery>({
        folderId: rootId ?? '',
        text: '',
        tags: [],
        type: 'all',
        sort: 'new',
    });

    React.useEffect(() => {
        if (!effectiveFolderId) return;
        setQ((p) => ({...p, folderId: effectiveFolderId}));
    }, [effectiveFolderId]);

    const {items, isLoading} = useMediaSearch(q);

    const crumbs = React.useMemo(() => {
        if (!rootId || !effectiveFolderId) return [{id: 'loading', name: 'Loading…'}];
        return buildCrumbs(rootId, folders, effectiveFolderId);
    }, [rootId, folders, effectiveFolderId]);

    const defaultOpenIds = React.useMemo(() => crumbs.map((c) => c.id), [crumbs]);

    function toggleTag(tag: string) {
        setQ((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
        }));
    }

    function goFolder(nextId: string) {
        if (!rootId) return;

        const next = new URLSearchParams(searchParams);
        if (nextId === rootId) next.delete('folder');
        else next.set('folder', nextId);
        setSearchParams(next);
    }

    if (tree.isLoading) {
        return (
            <div className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-muted-foreground">
                Loading drive folders…
            </div>
        );
    }

    if (tree.isError || !rootId) {
        return (
            <div className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-muted-foreground">
                Failed to load Drive folders.
            </div>
        );
    }

    const folderId = effectiveFolderId ?? rootId;

    return (
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
                {/* Sidebar */}
                <aside className="rounded-xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Drive</h2>
                        <button
                            onClick={() => goFolder(rootId)}
                            className="text-xs text-muted-foreground hover:text-foreground transition"
                        >
                            All media
                        </button>
                    </div>

                    <FolderTree
                        folders={folders}
                        rootId={rootId}
                        selectedId={folderId}
                        onSelect={goFolder}
                        defaultOpenIds={defaultOpenIds}
                    />

                    <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                        Later: bulk upload + bulk tag into the selected folder.
                    </div>
                </aside>

                {/* Main */}
                <section className="flex flex-col gap-4">
                    {/* Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {crumbs.map((c, idx) => (
                            <React.Fragment key={c.id}>
                                {idx > 0 && <span className="opacity-60">/</span>}
                                <button onClick={() => goFolder(c.id)} className="hover:text-foreground transition">
                                    {c.name}
                                </button>
                            </React.Fragment>
                        ))}

                        <div className="ml-auto">
                            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition">
                                Back home
                            </Link>
                        </div>
                    </div>

                    {/* Search + filters (unchanged) */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold text-foreground">Browse media</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">Scoped to folder + tags (API
                                        hookup next).</p>
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        value={q.type}
                                        onChange={(e) => setQ((p) => ({...p, type: e.target.value as any}))}
                                    >
                                        <option value="all">All types</option>
                                        <option value="photo">Photos</option>
                                        <option value="video">Videos</option>
                                        <option value="gif">GIFs</option>
                                        <option value="other">Other</option>
                                    </select>

                                    <select
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        value={q.sort}
                                        onChange={(e) => setQ((p) => ({...p, sort: e.target.value as any}))}
                                    >
                                        <option value="new">Newest</option>
                                        <option value="old">Oldest</option>
                                    </select>
                                </div>
                            </div>

                            <input
                                className="h-11 rounded-md border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Search (event name, tag, year, etc.)"
                                value={q.text}
                                onChange={(e) => setQ((p) => ({...p, text: e.target.value}))}
                            />

                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_TAGS.map((tag) => {
                                    const active = q.tags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={[
                                                'rounded-full border px-3 py-1 text-xs transition',
                                                active
                                                    ? 'border-transparent bg-media-gradient text-primary-foreground'
                                                    : 'border-border bg-background text-muted-foreground hover:text-foreground',
                                            ].join(' ')}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}

                                {q.tags.length > 0 && (
                                    <button
                                        onClick={() => setQ((p) => ({...p, tags: []}))}
                                        className="ml-auto text-xs text-muted-foreground hover:text-foreground transition"
                                    >
                                        Clear tags
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Grid (unchanged) */}
                    <div>
                        {isLoading ? (
                            <div className="text-sm text-muted-foreground">Loading…</div>
                        ) : items.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No results. Try another folder or remove
                                filters.</div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4">
                                {items.map((m) => (
                                    <button
                                        key={m.id}
                                        className="group overflow-hidden rounded-xl border border-border bg-card text-left"
                                        onClick={() => alert(`Open detail modal for ${m.id} (later)`)}
                                    >
                                        <div className="aspect-[4/3] w-full bg-secondary">
                                            <img
                                                src={m.thumbUrl}
                                                alt={m.title}
                                                className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                                            />
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                                                <span className="text-[11px] text-muted-foreground">{m.type}</span>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {m.tags.slice(0, 3).map((t) => (
                                                    <span
                                                        key={t}
                                                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
