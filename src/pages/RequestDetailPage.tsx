import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useRequest, useUpdateRequest } from "@/features/requests/hooks";

function isMediaTeam(email?: string) {
  return !!email && email.toLowerCase().includes("media");
}

export function RequestDetailPage() {
  const { id = "" } = useParams();
  const q = useRequest(id);
  const upd = useUpdateRequest(id);

  const item = q.data?.item;

  const [deliverableFolderId, setDeliverableFolderId] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (!item) return;
    setDeliverableFolderId(item.deliverableFolderId ?? "");
    setNotes(item.notes ?? "");
  }, [item?.id]);

  async function markDone() {
    await upd.mutateAsync({
      status: "done",
      deliverableFolderId: deliverableFolderId.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  if (q.isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (q.isError || !item) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 text-sm text-muted-foreground">
        Not found.
      </div>
    );
  }

  const mediaControls = isMediaTeam(item.createdByEmail) || true; // todo - figure out if a user is in media

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2 py-0.5">
              {item.division}
            </span>
            <span className="rounded-full border border-border bg-background px-2 py-0.5">
              {item.status.replace("_", " ")}
            </span>
            <span className="truncate">{item.createdByEmail}</span>
          </div>
        </div>

        <Link
          to="/requests"
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          Back to list
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">
            Description
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
            {item.description}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">
            Attachments
          </div>
          {item.attachmentLinks.length === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground">None.</div>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {item.attachmentLinks.map((href) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm text-muted-foreground hover:text-foreground transition"
                >
                  {href}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">
            Deliverable
          </div>

          {item.deliverableFolderId ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <Link
                to={`/media?folder=${encodeURIComponent(item.deliverableFolderId)}`}
                className="text-sm text-muted-foreground hover:text-foreground transition"
              >
                Open deliverables folder
              </Link>
              <span className="text-xs text-muted-foreground">
                Folder: {item.deliverableFolderId}
              </span>
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              Not delivered yet.
            </div>
          )}
        </div>

        {/* Media team controls */}
        {mediaControls && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold text-muted-foreground">
              Media actions
            </div>

            <div className="mt-3 grid gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  Deliverable folder id
                </div>
                <input
                  className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  placeholder="Link to Drive folder"
                  value={deliverableFolderId}
                  onChange={(e) => setDeliverableFolderId(e.target.value)}
                />
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Notes</div>
                <textarea
                  className="mt-2 min-h-[90px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Optional notes for the requester"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => upd.mutate({ status: "in_progress" })}
                  className="h-10 rounded-md border border-border bg-background px-4 text-sm text-foreground hover:bg-secondary transition"
                >
                  Mark in progress
                </button>
                <button
                  type="button"
                  onClick={markDone}
                  disabled={upd.isPending}
                  className="h-10 rounded-md bg-media-gradient px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {upd.isPending ? "Saving…" : "Mark done"}
                </button>
              </div>

              {upd.isError && (
                <div className="text-sm text-muted-foreground">
                  Update failed.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
