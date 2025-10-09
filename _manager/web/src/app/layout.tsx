import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Platforms", href: "/platforms" },
  {
    label: "Networks",
    children: [
      { label: "nginx", href: "/networks/nginx" },
      { label: "certbot", href: "/networks/certbot" },
    ],
  },
  {
    label: "Servers",
    children: [
      { label: "n8n", href: "/servers/n8n" },
      { label: "database", href: "/servers/database" },
      { label: "obsidian", href: "/servers/obsidian" },
      { label: "wordpress", href: "/servers/wordpress" },
    ],
  },
  {
    label: "Repositories",
    children: [
      { label: "github", href: "/repositories/github" },
      { label: "local", href: "/repositories/local" },
    ],
  },
  {
    label: "Settings",
    children: [
      { label: "Envs", href: "/settings?tab=envs" },
      { label: "Databases", href: "/settings?tab=databases" },
      { label: "Githubs", href: "/settings?tab=githubs" },
      { label: "Templates", href: "/settings?tab=templates" },
    ],
  },
  { label: "API Docs", href: "http://1.231.118.217:20101/docs", external: true },
];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Docker Manager",
  description: "Docker infrastructure management for platforms, projects, networks, servers, and repositories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    🐳 Docker Manager
                  </h1>
                </div>
                <nav className="flex space-x-6">
                  {navItems.map((item) => {
                    if (item.children?.length) {
                      return (
                        <div key={item.label} className="relative group">
                          <button
                            type="button"
                            aria-haspopup="true"
                            aria-expanded="false"
                            className="inline-flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium focus:outline-none"
                          >
                            <span>{item.label}</span>
                            <span className="ml-1 text-xs text-gray-400">▾</span>
                          </button>
                          <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 absolute left-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg transition">
                            {item.children.map((child) => (
                              <Link
                                key={child.label}
                                href={child.href}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (item.external && item.href) {
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          {item.label}
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={item.label}
                        href={item.href || "#"}
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
