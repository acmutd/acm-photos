export type DriveFolder = {
    id: string;
    name: string;
    parentId: string | null;
};

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

export const ROOT_FOLDER_ID = 'root';

export const MOCK_FOLDERS: DriveFolder[] = [
    {id: ROOT_FOLDER_ID, name: 'ACM Drive', parentId: null},

    {id: 'assets', name: 'Assets', parentId: ROOT_FOLDER_ID},
    {id: 'events', name: 'Events', parentId: ROOT_FOLDER_ID},
    {id: 'flyers', name: 'Flyers', parentId: ROOT_FOLDER_ID},

    {id: 'events-2026', name: '2026', parentId: 'events'},
    {id: 'events-2025', name: '2025', parentId: 'events'},

    {id: 'events-2026-hackutd', name: 'HackUTD', parentId: 'events-2026'},
    {id: 'events-2026-general', name: 'General', parentId: 'events-2026'},
];

export const MOCK_MEDIA: MediaItem[] = Array.from({length: 36}).map((_, i) => {
    const folderId =
        i % 5 === 0 ? 'assets' :
            i % 4 === 0 ? 'flyers' :
                i % 3 === 0 ? 'events-2026-hackutd' :
                    'events-2026-general';

    return {
        id: `mock-${i + 1}`,
        folderId,
        title: `${folderId.toUpperCase()} • Item ${i + 1}`,
        type: folderId === 'flyers' ? 'other' : 'photo',
        takenAt: new Date(Date.now() - i * 86_400_000).toISOString(),
        tags:
            folderId === 'assets'
                ? ['asset', 'branding']
                : folderId === 'events-2026-hackutd'
                    ? ['hackutd', '2026']
                    : ['acm', 'event', '2026'],
        thumbUrl: '/assets/home/noise.png', // placeholder image
    };
});
