import * as React from 'react';
import {ChevronRight} from 'lucide-react';
import {cn} from '@/lib/cn';

export type DriveFolder = {
    id: string;
    name: string;
    parentId: string | null;
};

type FolderTreeProps = {
    folders: DriveFolder[];
    rootId: string;
    selectedId: string;
    onSelect: (id: string) => void;

    defaultOpenIds?: string[];
};

type TreeNode = DriveFolder & { children: TreeNode[] };

function buildTree(folders: DriveFolder[], rootId: string): TreeNode {
    const byId = new Map<string, DriveFolder>(folders.map((f) => [f.id, f]));
    if (!byId.has(rootId)) {
        byId.set(rootId, {id: rootId, name: 'Root', parentId: null});
    }

    const childrenMap = new Map<string, DriveFolder[]>();
    for (const f of byId.values()) {
        const p = f.parentId ?? '__null__';
        const arr = childrenMap.get(p) ?? [];
        arr.push(f);
        childrenMap.set(p, arr);
    }

    for (const [k, arr] of childrenMap.entries()) {
        arr.sort((a, b) => a.name.localeCompare(b.name));
        childrenMap.set(k, arr);
    }

    const make = (id: string): TreeNode => {
        const self = byId.get(id)!;
        const kids = childrenMap.get(id) ?? [];
        return {...self, children: kids.map((c) => make(c.id))};
    };

    return make(rootId);
}

function TreeRow(props: {
    node: TreeNode;
    depth: number;
    openIds: Set<string>;
    toggleOpen: (id: string) => void;
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    const {node, depth, openIds, toggleOpen, selectedId, onSelect} = props;

    const hasChildren = node.children.length > 0;
    const isOpen = openIds.has(node.id);
    const isSelected = selectedId === node.id;

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-1 rounded-md pr-2 transition',
                    isSelected ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                )}
                style={{paddingLeft: 8 + depth * 12, paddingTop: 6, paddingBottom: 6}}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
                        aria-expanded={isOpen}
                        onClick={() => toggleOpen(node.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-background/40"
                    >
                        <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}/>
                    </button>
                ) : (
                    <div className="h-6 w-6"/>
                )}

                <button
                    type="button"
                    onClick={() => onSelect(node.id)}
                    className="min-w-0 flex-1 truncate text-left text-sm"
                    title={node.name}
                >
                    {node.name}
                </button>
            </div>

            {hasChildren && isOpen && (
                <div className="mt-0.5">
                    {node.children.map((child) => (
                        <TreeRow
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            openIds={openIds}
                            toggleOpen={toggleOpen}
                            selectedId={selectedId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderTree({
                               folders,
                               rootId,
                               selectedId,
                               onSelect,
                               defaultOpenIds = [],
                           }: FolderTreeProps) {
    const tree = React.useMemo(() => buildTree(folders, rootId), [folders, rootId]);

    const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set(defaultOpenIds));

    React.useEffect(() => {
        setOpenIds((prev) => new Set(prev));
    }, [selectedId]);

    function toggleOpen(id: string) {
        setOpenIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <div className="flex flex-col gap-1">
            {/* Root row */}
            <TreeRow
                node={tree}
                depth={0}
                openIds={openIds}
                toggleOpen={toggleOpen}
                selectedId={selectedId}
                onSelect={onSelect}
            />
        </div>
    );
}
