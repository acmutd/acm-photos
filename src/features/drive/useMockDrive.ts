import * as React from 'react';
import {MOCK_FOLDERS, type DriveFolder} from './mockDrive';

export function useFolderChildren(parentId: string) {
    return React.useMemo(
        () => MOCK_FOLDERS.filter((f) => f.parentId === parentId),
        [parentId]
    );
}

export function useFolderById(id: string) {
    return React.useMemo(() => MOCK_FOLDERS.find((f) => f.id === id) ?? null, [id]);
}

export function useFolderPath(folderId: string) {
    return React.useMemo(() => {
        const byId = new Map(MOCK_FOLDERS.map((f) => [f.id, f]));
        const path: DriveFolder[] = [];
        let cur = byId.get(folderId);

        while (cur) {
            path.push(cur);
            if (!cur.parentId) break;
            cur = byId.get(cur.parentId);
        }

        return path.reverse();
    }, [folderId]);
}
