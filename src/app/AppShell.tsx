import {Outlet} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Footer} from '@/components/Footer';

const queryClient = new QueryClient();

export function AppShell() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-dvh bg-background">
                <header className="border-b border-border">
                    <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
                        <a href="/" className="text-sm font-semibold">
                            ACM Photos
                        </a>
                        <div className="ml-auto text-xs text-muted-foreground">Google Drive coming soon!</div>
                    </div>
                </header>

                <main className="background-container">
                    <div className="content">
                        <Outlet/>
                    </div>
                </main>

                <Footer/>
            </div>
        </QueryClientProvider>
    );
}
