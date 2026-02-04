import * as React from "react";
import type { MediaItem } from "@/features/drive/types";

type Props = {
  open: boolean;
  item: MediaItem | null;
  onClose: () => void;
  onAddTag?: (fileId: string, tag: string) => void;
};

function useLockBodyScroll(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function isHeifMime(mimeType?: string | null) {
  const m = (mimeType ?? "").toLowerCase();
  return (
    m === "image/heif" ||
    m === "image/heic" ||
    m === "image/heif-sequence" ||
    m === "image/heic-sequence"
  );
}

export function MediaItemModal({ open, item, onClose, onAddTag }: Props) {
  const [tag, setTag] = React.useState("");
  const [hiLoaded, setHiLoaded] = React.useState(false);
  const [hiFailed, setHiFailed] = React.useState(false);
  const titleId = React.useId();

  useLockBodyScroll(open);

  React.useEffect(() => {
    if (!open) return;
    setTag("");
    setHiLoaded(false);
    setHiFailed(false);
  }, [open, item?.id]);

  const isVideo =
    item?.mimeType?.startsWith("video/") || item?.type === "video";
  const isHeif = isHeifMime(item?.mimeType);

  React.useEffect(() => {
    if (!open || !item || isVideo || isHeif) return;

    const fullResSrc = `/api/drive/file?id=${encodeURIComponent(item.id)}`;
    const img = new Image();
    img.src = fullResSrc;

    img.onload = () => {
      setHiLoaded(true);
    };

    img.onerror = () => {
      setHiFailed(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };
  }, [open, item?.id, isVideo, isHeif]);

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  const placeholderSrc = item.thumbUrl;
  const fullResSrc = `/api/drive/file?id=${encodeURIComponent(item.id)}`;
  const downloadHref = `/api/drive/download?id=${encodeURIComponent(item.id)}`;

  function submitTag() {
    const t = tag.trim();
    if (!t) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    onAddTag?.(item.id, t);
    setTag("");
  }

  const renderContent = () => {
    if (isHeif) {
      return (
        <>
          <img
            key={`${item.id}-heif-placeholder`}
            src={placeholderSrc}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-contain"
            loading="eager"
          />
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <p>HEIF/HEIC preview isn’t supported in this browser.</p>
            <a href={downloadHref} className="underline hover:text-foreground">
              Download to view
            </a>
          </div>
        </>
      );
    }

    if (hiFailed) {
      return (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
          <p>Preview unavailable.</p>
          <a href={downloadHref} className="underline hover:text-foreground">
            Download to view
          </a>
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          className="absolute inset-0 h-full w-full object-contain"
          controls
          autoPlay
          playsInline
          src={fullResSrc}
          onLoadedData={() => setHiLoaded(true)}
          onError={() => setHiFailed(true)}
        />
      );
    }

    return (
      <>
        <img
          key={`${item.id}-placeholder`}
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={[
            "absolute inset-0 h-full w-full object-cover",
            "scale-[1.02] blur-md opacity-80",
            hiLoaded
              ? "opacity-0 transition-opacity duration-200"
              : "opacity-80",
          ].join(" ")}
          draggable={false}
        />

        <img
          key={`${item.id}-full`}
          src={fullResSrc}
          alt={item.title}
          className={[
            "absolute inset-0 h-full w-full object-contain",
            hiLoaded ? "opacity-100" : "opacity-0",
            "transition-opacity duration-200",
          ].join(" ")}
          loading="eager"
          onLoad={() => setHiLoaded(true)}
          onError={() => setHiFailed(true)}
        />
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60"
        onMouseDown={onClose}
        onTouchStart={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div
              id={titleId}
              className="truncate text-sm font-semibold text-foreground"
            >
              {item.title}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {item.type}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadHref}
              className="h-9 inline-flex items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1fr_280px]">
          <div className="rounded-xl bg-secondary/40 p-2">
            <div className="w-full overflow-hidden rounded-lg bg-secondary/40">
              <div className="relative aspect-square w-full">
                {!hiLoaded && !hiFailed && !isVideo && !isHeif && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  </div>
                )}

                {renderContent()}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-xs font-semibold text-foreground">Tags</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags?.length ? (
                  item.tags.map((t: string) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No tags yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="text-xs font-semibold text-foreground">
                Add tag
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitTag();
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. sp26, marketing"
                />
                <button
                  type="button"
                  onClick={submitTag}
                  className="h-10 rounded-md bg-media-gradient px-3 text-sm font-semibold text-primary-foreground"
                >
                  Add
                </button>
              </div>
            </div>

            {item.viewUrl && (
              <a
                href={item.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground hover:text-foreground transition"
              >
                Open in Drive
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
