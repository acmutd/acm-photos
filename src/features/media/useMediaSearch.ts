import * as React from 'react';
import {MOCK_MEDIA, ROOT_FOLDER_ID} from '@/features/drive/mockDrive';

export type MediaType = 'photo' | 'video' | 'gif' | 'other';

export type MediaItem = {
    id: string;
    folderId: string;
    title: string;
    type: MediaType;
    takenAt?: string;
    tags: string[];
    thumbUrl: string;
};

export type MediaSearchQuery = {
    folderId: string;          // NEW
    text: string;
    tags: string[];
    type: 'all' | MediaType;
    sort: 'new' | 'old';
};

export function useMediaSearch(query: MediaSearchQuery) {
    const [items, setItems] = React.useState<MediaItem[]>([]);
    const [isLoading, setLoading] = React.useState(false);

    React.useEffect(() => {
        setLoading(true);

        const t = setTimeout(() => {
            const text = query.text.trim().toLowerCase();

            const filtered = MOCK_MEDIA.filter((m) => {
                const folderOk = query.folderId === ROOT_FOLDER_ID || m.folderId === query.folderId;
                const textOk =
                    !text || m.title.toLowerCase().includes(text) || m.tags.some((t) => t.includes(text));
                const typeOk = query.type === 'all' || m.type === query.type;
                const tagsOk = query.tags.length === 0 || query.tags.every((t) => m.tags.includes(t));
                return folderOk && textOk && typeOk && tagsOk;
            });

            const sorted = query.sort === 'new' ? filtered : [...filtered].reverse();
            setItems(sorted);
            setLoading(false);
        }, 150);

        return () => clearTimeout(t);
    }, [query.folderId, query.text, query.tags, query.type, query.sort]);

    return {items, isLoading};
}
