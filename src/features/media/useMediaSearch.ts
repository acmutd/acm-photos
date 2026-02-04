import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { getDriveMedia, type DriveMediaResponse } from "@/features/drive/api";
import type { MediaSearchQuery, MediaItem } from "@/features/drive/types";

type Options = { mode?: "direct" | "recursive"; pageSize?: number };
type PageParam = string | null;

export function useMediaSearch(q: MediaSearchQuery, opts: Options = {}) {
  const mode = opts.mode ?? "direct";
  const pageSize = opts.pageSize ?? 60;

  const queryKey = [
    "media",
    mode,
    pageSize,
    q.folderId,
    q.text,
    q.type,
    q.sort,
    q.tags.join(","),
  ] as const;

  const r = useInfiniteQuery<
    DriveMediaResponse,
    Error,
    InfiniteData<DriveMediaResponse>,
    typeof queryKey,
    PageParam
  >({
    queryKey,
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      mode === "recursive"
        ? getDriveMedia(q, { mode: "recursive", cursor: pageParam, pageSize })
        : getDriveMedia(q, { mode: "direct", pageToken: pageParam, pageSize }),
    getNextPageParam: (lastPage) => {
      const next =
        mode === "recursive" ? lastPage.nextCursor : lastPage.nextPageToken;
      return next ?? undefined;
    },
  });

  const items: MediaItem[] = (r.data?.pages ?? []).flatMap(
    (p) => p.items ?? [],
  );

  return {
    items,
    isLoading: r.isLoading,
    isFetching: r.isFetching,
    fetchNextPage: r.fetchNextPage,
    hasNextPage: r.hasNextPage,
    isFetchingNextPage: r.isFetchingNextPage,
  };
}
