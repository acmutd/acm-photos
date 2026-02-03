import * as React from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {api} from '@/lib/api';

export function SignInPage() {
    const qc = useQueryClient();
    const [email, setEmail] = React.useState('');

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        await api('/api/auth/mock-login', {
            method: 'POST',
            body: JSON.stringify({email}),
        });
        await qc.invalidateQueries({queryKey: ['me']});
    }

    return (
        <div className="mx-auto w-full max-w-md px-6 py-20">
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-2 h-1.5 w-20 rounded-full bg-acm-gradient"/>
                <h1 className="text-xl font-semibold">Sign in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Mock auth for now. Use your @acmutd.co email please.
                </p>

                <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
                    <input
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="you@acmutd.co"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        className="h-10 rounded-md bg-acm-gradient px-4 text-sm font-medium text-primary-foreground"
                        type="submit"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
}
