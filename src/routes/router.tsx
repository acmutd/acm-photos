import {createBrowserRouter} from 'react-router-dom';
import {AppShell} from '@/app/AppShell';
import {HomePage} from '@/pages/HomePage';
import {MediaPage} from '@/pages/MediaPage';
import {RequestsPage} from '@/pages/RequestsPage';
import {RequestNewPage} from '@/pages/RequestNewPage';
import {RequestDetailPage} from '@/pages/RequestDetailPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <AppShell/>,
        children: [
            {index: true, element: <HomePage/>},
            {path: 'media', element: <MediaPage/>},

            {path: 'requests', element: <RequestsPage/>},
            {path: 'requests/new', element: <RequestNewPage/>},
            {path: 'requests/:id', element: <RequestDetailPage/>},
        ],
    },
]);
