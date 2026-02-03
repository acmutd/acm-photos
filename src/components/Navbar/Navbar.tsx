import * as React from 'react';
import {Link, NavLink} from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {ChevronDown, LogOut} from 'lucide-react';
import {useQueryClient} from '@tanstack/react-query';

import {cn} from '@/lib/cn';
import {api} from '@/lib/api';

type NavbarProps = {
    email?: string;
};

function navClass({isActive}: { isActive: boolean }) {
    return cn(
        'rounded-md px-3 py-2 text-sm transition',
        isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
    );
}

export function Navbar({email}: NavbarProps) {
    const qc = useQueryClient();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    async function logout() {
        if (isLoggingOut) return;
        setIsLoggingOut(true);

        qc.removeQueries({queryKey: ['me'], exact: true});

        try {
            await api('/api/auth/logout', {method: 'POST'});
        } finally {
            setIsLoggingOut(false);
            window.location.reload();
        }
    }

    return (
        <header className="border-b border-border">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">
                <Link to="/" className="flex items-center gap-2">
                    <img src={'assets/acm-logo.png'} alt={'ACM Logo'} className="h-6 w-9"/>
                    <span className="text-sm font-semibold">ACM Photos</span>
                </Link>

                <nav className="ml-3 hidden items-center gap-1 sm:flex">
                    <NavLink to="/media" className={navClass}>
                        Browse
                    </NavLink>
                    <NavLink to="/upload" className={navClass}>
                        Upload
                    </NavLink>
                    <NavLink to="/requests" className={navClass}>
                        Requests
                    </NavLink>
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    {email ? (
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button
                                    disabled={isLoggingOut}
                                    className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                                >
                                    {email}
                                    <ChevronDown className="h-4 w-4"/>
                                </button>
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    align="end"
                                    sideOffset={10}
                                    className="z-50 min-w-[12rem] overflow-hidden rounded-lg border border-border bg-card p-1 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                                >
                                    <DropdownMenu.Item
                                        disabled={isLoggingOut}
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            logout();
                                        }}
                                        className="flex cursor-default select-none items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition hover:bg-secondary data-[disabled]:opacity-60"
                                    >
                                        <LogOut className="h-4 w-4"/>
                                        {isLoggingOut ? 'Logging out…' : 'Log out'}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    ) : (
                        <span className="text-xs text-muted-foreground">Not signed in</span>
                    )}
                </div>
            </div>
        </header>
    );
}
