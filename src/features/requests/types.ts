export type Division =
    | 'Development'
    | 'Projects'
    | 'Research'
    | 'Education'
    | 'Media'
    | 'HackUTD'
    | 'Industry'
    | 'Community'
    | 'Exec'
    | 'Finance';

export type RequestStatus = 'open' | 'in_progress' | 'done';

export type RequestTicket = {
    id: string;
    createdAt: string;
    createdByEmail: string;

    division: Division;
    title: string;
    description: string;

    dateNeededBy?: string;
    attachmentLinks: string[];
    status: RequestStatus;

    // holy peak once i finish this lmao
    deliverableFolderId?: string;
    notes?: string;
};
