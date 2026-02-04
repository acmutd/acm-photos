import type {DriveFolder} from './useDriveTree';

export function buildCrumbs(rootId: string, folders: DriveFolder[], folderId: string) {
    const map = new Map(folders.map((f) => [f.id, f]));
    const crumbs: Array<{ id: string; name: string }> = [];

    let cur: string | null = folderId;
    const seen = new Set<string>();

    while (cur && !seen.has(cur)) {
        seen.add(cur);

        if (cur === rootId) {
            crumbs.push({id: rootId, name: 'All media'});
            break;
        }

        const f = map.get(cur);
        if (!f) break;

        crumbs.push({id: f.id, name: f.name});
        cur = f.parentId;
    }

    return crumbs.reverse();
}
