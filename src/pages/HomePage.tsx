export function HomePage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                    ACM Photo Library
                </h1>

                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Search and organize chapter photos, videos, flyers, and event albums using tags and
                    metadata. Uploads curated by the media team.
                </p>

                <div className="mt-2 flex flex-wrap gap-3">
                    <a
                        href="/"
                        className="rounded-md bg-acm-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
                    >
                        Browse media
                    </a>
                    <a
                        href="/upload"
                        className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition"
                    >
                        Upload (coming soon!)
                    </a>
                </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    {title: 'Tagging', desc: 'Event, year, type, project, people (manual).'},
                    {title: 'Search', desc: 'Fast filters + saved searches later.'},
                    {title: 'Permissions', desc: 'View for members, upload for media team.'},
                ].map((c) => (
                    <div key={c.title} className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-2 h-1.5 w-16 rounded-full bg-media-gradient"/>
                        <h2 className="text-base font-semibold">{c.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
