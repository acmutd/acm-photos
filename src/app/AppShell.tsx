import {Outlet, useLocation} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Footer} from '@/components/Footer';
import {useMe} from '@/hooks/useMe';
import {SignInPage} from '@/pages/SignInPage';
import {Navbar} from '@/components/Navbar';

const queryClient = new QueryClient();

function AppShellInner() {
    const me = useMe();
    const location = useLocation();

    const isPublicRoute =
        location.pathname === '/privacy' ||
        location.pathname.startsWith('/privacy/') ||
        location.pathname === '/';

    return (
        <div className="min-h-dvh bg-background">
            <Navbar email={me.data?.email}/>

            <main className="background-container">
                <div className="content">
                    {isPublicRoute ? (
                        <Outlet/>
                    ) : me.isLoading ? (
                        <div className="mx-auto max-w-6xl px-6 py-14 text-sm text-muted-foreground">
                            Loading…
                        </div>
                    ) : me.isError ? (
                        <SignInPage/>
                    ) : (
                        <Outlet/>
                    )}
                </div>
            </main>

            <Footer/>
        </div>
    );
}

export function AppShell() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppShellInner/>
        </QueryClientProvider>
    );
}
