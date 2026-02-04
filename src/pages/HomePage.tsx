import { Link, useSearchParams } from "react-router-dom";
import * as React from "react";

function prettyReason(reason: string | null) {
  switch (reason) {
    case "state":
      return "Security check failed (state mismatch). Try again.";
    case "no_refresh_token":
      return "Google didn’t give us a refresh token. Remove app access in your Google Account and sign in again.";
    case "wrong_domain":
      return "Please use your @acmutd.co account.";
    case "no_email":
      return "Google didn’t provide an email address.";
    case "no_id_token":
      return "Missing ID token from Google.";
    case "exception":
      return "Something went wrong on our side. Try again.";
    default:
      return "Sign-in failed. Try again.";
  }
}

export function HomePage() {
  const [sp, setSp] = useSearchParams();
  const auth = sp.get("auth"); // "ok" | "error" | null
  const reason = sp.get("reason");

  React.useEffect(() => {
    if (!auth) return;

    const t = setTimeout(
      () => {
        const next = new URLSearchParams(sp);
        next.delete("auth");
        next.delete("reason");
        setSp(next, { replace: true });
      },
      auth === "ok" ? 2500 : 6000,
    );

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10 lg:py-12">
      {auth && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              {auth === "ok" ? (
                <>
                  <div className="font-medium">Signed in.</div>
                  <div className="text-muted-foreground">
                    You’re good to go.
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">Sign-in didn’t work.</div>
                  <div className="text-muted-foreground">
                    {prettyReason(reason)}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(sp);
                next.delete("auth");
                next.delete("reason");
                setSp(next, { replace: true });
              }}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              aria-label="Dismiss"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            ACM Photo Library
          </h1>

          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Search and organize chapter photos, videos, flyers, and event albums
            using tags and metadata. Uploads curated by the media team.
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
                className="ml-2 w-full max-w-[240px] select-none object-contain motion-safe:animate-peechiSway origin-center"
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
          {
            title: "Tagging",
            desc: "Event, year, type, project, people, etc.",
          },
          { title: "Search", desc: "Fast filters + saved searches later." },
          {
            title: "Permissions",
            desc: "View for members, upload for media team.",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-2 h-1.5 w-14 rounded-full bg-media-gradient" />
            <h2 className="text-base font-semibold">{c.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
