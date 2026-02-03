import {useQueryClient} from '@tanstack/react-query';

export function SignInPage() {
    const qc = useQueryClient();

    function startGoogleSignIn() {
        window.location.assign('/api/auth/google/start');
    }

    return (
        <div className="mx-auto w-full max-w-md px-6 py-20">
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-2 h-1.5 w-20 rounded-full bg-media-gradient"/>
                <h1 className="text-xl font-semibold">Sign in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Continue with your @acmutd.co Google account.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={startGoogleSignIn}
                        className="h-10 rounded-md bg-media-gradient px-4 text-sm font-medium text-primary-foreground"
                    >
                        Continue with Google
                    </button>

                    <button
                        type="button"
                        onClick={() => qc.invalidateQueries({queryKey: ['me']})}
                        className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-secondary transition"
                        title="If you just signed in in another tab, this refreshes the page."
                    >
                        I already signed in
                    </button>
                </div>
            </div>
        </div>
    );
}
