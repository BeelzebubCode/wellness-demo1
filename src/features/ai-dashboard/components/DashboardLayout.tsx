import { ReactNode } from "react";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </header>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
