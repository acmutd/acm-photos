export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterSection = {
  title: string;
  links: FooterLink[];
};

export const footerData: {
  sections: FooterSection[];
  community: Record<string, string>;
} = {
  sections: [
    {
      title: "ACM Photos",
      links: [
        { label: "Browse", href: "/media" },
        { label: "Upload", href: "/upload" },
        { label: "Requests", href: "/requests" },
      ],
    },
    {
      title: "Guidelines",
      links: [
        { label: "Privacy", href: "/privacy" },
      ],
    },
    {
      title: "Chapter",
      links: [
        { label: "Main website", href: "https://acmutd.co", external: true },
        { label: "Contact", href: "mailto:contact@acmutd.co", external: true },
      ],
    },
  ],
  community: {
    discord: "https://discord.gg/V9SHCKuXhX",
    instagram: "https://instagram.com/acmutd",
    github: "https://github.com/acmutd",
    linkedin: "https://www.linkedin.com/company/acmutd/",
  },
};
