import * as React from "react";
import { Link } from "react-router-dom";

const SUGGESTED_TAGS = ["hackutd", "acm", "event", "branding", "flyer", "2026"];

type UploadType = "photos" | "videos" | "mixed";

export function UploadPage() {
  const [uploadType, setUploadType] = React.useState<UploadType>("mixed");
  const [folderId, setFolderId] = React.useState("");
  const [bulkTags, setBulkTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);

  function toggleTag(tag: string) {
    setBulkTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function addTagFromInput() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    setBulkTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }

  function removeTag(tag: string) {
    setBulkTags((prev) => prev.filter((t) => t !== tag));
  }

  const accept =
    uploadType === "photos"
      ? "image/*"
      : uploadType === "videos"
        ? "video/*"
        : "image/*,video/*"; // accept can be a comma-separated list [web:523]

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Upload</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drop media into a folder and optionally apply tags in bulk.
          </p>
        </div>

        <Link
          to="/media"
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          Back to media
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {/* Destination */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 h-1.5 w-16 rounded-full bg-media-gradient" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Destination</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Later this will be a folder picker; for now you can paste a
                folder id.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                onClick={() => setFolderId("")}
              >
                Clear
              </button>
              <button
                type="button"
                className="h-10 rounded-md bg-media-gradient px-3 text-sm font-medium text-primary-foreground opacity-60"
                onClick={() => {}}
                title="Coming soon"
              >
                Pick folder (soon)
              </button>
            </div>
          </div>

          <input
            className="mt-3 h-11 w-full rounded-md border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Folder ID (temporary) — e.g. 1a2B3c..."
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
          />
        </div>

        {/* Bulk tags */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 h-1.5 w-16 rounded-full bg-media-gradient" />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Bulk tags</div>
              <div className="mt-1 text-xs text-muted-foreground">
                These will be applied to every uploaded item (you can edit
                per-item later).
              </div>
            </div>

            {bulkTags.length > 0 && (
              <button
                type="button"
                onClick={() => setBulkTags([])}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Clear tags
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((tag) => {
              const active = bulkTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs transition",
                    active
                      ? "border-transparent bg-media-gradient text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Add custom tag…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagFromInput();
                }
              }}
            />
            <button
              type="button"
              onClick={addTagFromInput}
              className="h-10 rounded-md border border-border bg-background px-4 text-sm text-foreground hover:bg-secondary transition"
            >
              Add
            </button>
          </div>

          {bulkTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bulkTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => removeTag(t)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition"
                  title="Remove"
                >
                  {t} ×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File picker */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 h-1.5 w-16 rounded-full bg-media-gradient" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Files</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Choose one or more files (photos/videos). Upload button is wired
                later.
              </div>
            </div>

            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value as UploadType)}
              >
                <option value="mixed">Mixed</option>
                <option value="photos">Photos only</option>
                <option value="videos">Videos only</option>
              </select>

              <button
                type="button"
                className="h-10 rounded-md border border-border bg-background px-4 text-sm text-foreground hover:bg-secondary transition"
                onClick={() => setSelectedFiles([])}
              >
                Clear
              </button>
            </div>
          </div>

          <input
            type="file"
            multiple
            accept={accept}
            className="mt-3 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-2 file:text-xs file:text-foreground"
            onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
          />

          {selectedFiles.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">
                Selected ({selectedFiles.length})
              </div>
              <div className="mt-2 max-h-40 overflow-auto">
                <ul className="flex flex-col gap-1 text-sm">
                  {selectedFiles.slice(0, 25).map((f) => (
                    <li
                      key={`${f.name}-${f.size}`}
                      className="truncate text-muted-foreground"
                    >
                      {f.name}{" "}
                      <span className="text-xs opacity-70">
                        ({Math.round(f.size / 1024)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
                {selectedFiles.length > 25 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    +{selectedFiles.length - 25} more…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link
            to="/media"
            className="h-10 rounded-md border border-border bg-background px-4 text-sm text-foreground hover:bg-secondary transition inline-flex items-center justify-center"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => {}}
            className="h-10 rounded-md bg-media-gradient px-4 text-sm font-medium text-primary-foreground opacity-60"
            title="Wiring soon"
          >
            Upload (soon)
          </button>
        </div>
      </div>
    </div>
  );
}
