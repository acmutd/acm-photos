import {Link} from 'react-router-dom';

export function HomePage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10 lg:py-12">
            {/* Hero */}
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_340px]">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                        ACM Photo Library
                    </h1>

                    <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Search and organize chapter photos, videos, flyers, and event albums using tags and
                        metadata. Uploads curated by the media team.
                    </p>

                    <div className="mt-1 flex flex-wrap gap-3">
                        <Link
                            to="/media"
                            className="rounded-md bg-media-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            Browse media
                        </Link>
                        <a
                            href="/upload"
                            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
                        >
                            Upload (coming soon!)
                        </a>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-sm">
                    <div className="relative flex flex-col items-center justify-center">
                        <div
                            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-media-gradient opacity-60 blur-2xl"
                            aria-hidden="true"
                        />
                        <div
                            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-media-gradient opacity-70"
                            aria-hidden="true"
                        />

                        <div className="relative flex items-center justify-center">
                            <img
                                src="/assets/acmp-peechi-transparent.webp"
                                alt="ACM Photos mascot"
                                className="w-full max-w-[240px] select-none object-contain ml-2 motion-safe:animate-peechiSway origin-center"
                                draggable={false}
                            />
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            Peechi approves this workflow!
                        </p>
                    </div>
                </div>
            </div>

            {/* Feature cards */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    {title: 'Tagging', desc: 'Event, year, type, project, people (manual).'},
                    {title: 'Search', desc: 'Fast filters + saved searches later.'},
                    {title: 'Permissions', desc: 'View for members, upload for media team.'},
                ].map((c) => (
                    <div key={c.title} className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-2 h-1.5 w-14 rounded-full bg-media-gradient"/>
                        <h2 className="text-base font-semibold">{c.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
