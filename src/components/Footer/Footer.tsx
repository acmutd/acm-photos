import {footerData} from '@/config/footer.config';
import {
    Github,
    Instagram,
    Linkedin,
    Mail,
    MessageCircle,
} from 'lucide-react';

function iconFor(key: string) {
    switch (key.toLowerCase()) {
        case 'discord':
            return MessageCircle;
        case 'instagram':
            return Instagram;
        case 'github':
            return Github;
        case 'linkedin':
            return Linkedin;
        case 'email':
            return Mail;
        default:
            return null;
    }
}

export default function Footer() {
    const entries = Object.entries(footerData.community);

    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto w-full max-w-6xl px-6 py-12">
                <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-4">
                        <a href="/" className="inline-flex items-center gap-3">
                            <img
                                src="/assets/chapter-logo.png"
                                alt="ACM UTD"
                                className="h-8 w-auto"
                            />
                            <span className="text-sm text-muted-foreground">
                Shared photo library
              </span>
                        </a>

                        <p className="max-w-md text-sm text-muted-foreground">
                            Uploads are curated by the media team. Use tags to find events,
                            people, projects, and years.
                        </p>

                        <div className="flex items-center gap-3">
                            {entries.map(([key, href]) => {
                                const Icon = iconFor(key);
                                if (!Icon) return null;

                                return (
                                    <a
                                        key={key}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={key}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition hover:opacity-90"
                                    >
                                        <Icon className="h-4 w-4"/>
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                        {footerData.sections.map((section) => (
                            <div key={section.title} className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {section.title}
                                </h3>

                                <ul className="flex flex-col gap-2">
                                    {section.links.map((link) => (
                                        <li key={link.href}>
                                            <a
                                                href={link.href}
                                                target={link.external ? '_blank' : undefined}
                                                rel={link.external ? 'noreferrer' : undefined}
                                                className="text-sm text-muted-foreground hover:text-foreground transition"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>© {new Date().getFullYear()} ACM UTD</span>
                    <span className="text-muted-foreground/80">Built by ACM Development</span>
                </div>
            </div>
        </footer>
    );
}
