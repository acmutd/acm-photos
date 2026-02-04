import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Privacy</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiny app, big respect for your data.
          </p>
        </div>

        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          Back home
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-media-gradient" />
          <h2 className="text-base font-semibold">TL;DR</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We only use Google sign-in to confirm you’re allowed to access ACM
            Photos, then we show you the media you already have permission to
            see.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Searching/filtering is designed to be lightweight and mostly
            client-side, so we’re not building creepy analytics pipelines over
            your clicks.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            If you want a photo removed, tell us and we’ll take care of it.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-acm-gradient" />
          <h2 className="text-base font-semibold">What we collect</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <p>
              <span className="text-foreground font-medium">Account:</span> Your
              email address (so we can show “who you are” and gate access).
            </p>
            <p>
              <span className="text-foreground font-medium">Requests:</span>{" "}
              Anything you type into a request ticket (division, description,
              “needed by” date, links you attach).
            </p>
            <p>
              <span className="text-foreground font-medium">
                Media metadata:
              </span>{" "}
              File names, folder structure, and tags/labels needed to make
              search work.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-media-gradient" />
          <h2 className="text-base font-semibold">Google + Drive stuff</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Authentication is handled through Google’s OAuth flow; we don’t ask
            you for your password (ever). [web:281]
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            When we connect to Google Drive, we’ll request only the scopes
            needed for the features you’re using (for example, listing media,
            reading metadata, or downloads). [web:273][web:275]
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your access still follows Drive permissions—if you can’t see
            something in Drive, you shouldn’t see it here either.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-acm-gradient" />
          <h2 className="text-base font-semibold">What we don’t do</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <p>
              We don’t sell your data (we’re a student org site, not a startup
              pitch deck).
            </p>
            <p>We don’t run ad tracking or build “profiles” on members.</p>
            <p>
              We don’t collect private Drive files outside the folder(s) this
              project is meant to index.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-media-gradient" />
          <h2 className="text-base font-semibold">Removal requests</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you’re in a photo and want it removed (or blurred), please
            contact ACM Exec or the Media team.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Include the link to the item (or the folder + filename) and what you
            want changed, we'll handle it from there - no questions asked. No,
            that's not an em-dash, I genuinely just use hyphens every now and
            then.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-2 h-1.5 w-14 rounded-full bg-acm-gradient" />
          <h2 className="text-base font-semibold">Contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The best route is to ping/dm ACM Exec or Media in Discord. If you’d
            rather email, click "Contact" in the footer of this page.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Last updated: Feb 3, 2026.
          </p>
        </section>
      </div>
    </div>
  );
}
