export type MediaTypeFilter = 'all' | 'photo' | 'video' | 'gif' | 'other';
export type MediaSort = 'new' | 'old';

export type MediaSearchQuery = {
    folderId: string;
    text: string;
    tags: string[];
    type: MediaTypeFilter;
    sort: MediaSort;
};

export type MediaItem = {
    id: string;
    title: string;
    type: 'photo' | 'video' | 'gif' | 'other';
    tags: string[];
    thumbUrl: string;
    viewUrl?: string;
    createdAt?: string;
};
