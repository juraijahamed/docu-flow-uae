import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import brandLogo from "@/assets/quick-documents-clearing-logo.png";
import brandIcon from "@/assets/quick-documents-clearing-icon.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(
      error instanceof Error ? error : new Error(String(error)),
      { boundary: "tanstack_root_error_component" },
    );
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Quick Documents Clearing — Invoice Generator" },
      {
        name: "description",
        content:
          "Professional UAE VAT invoicing for Quick Documents Clearing services.",
      },
      { name: "author", content: "Quick Documents Clearing" },
      { property: "og:title", content: "Quick Documents Clearing — Invoice Generator" },
      {
        property: "og:description",
        content:
          "Create professional UAE VAT invoices for typing, PRO and document clearing services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

function AppNav() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex min-w-0 items-center gap-3 group">
          <img src={brandIcon} alt="" className="h-11 w-11 shrink-0 object-contain sm:hidden" />
          <img
            src={brandLogo}
            alt="Quick Documents Clearing"
            className="hidden h-12 w-auto max-w-[320px] object-contain sm:block"
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/invoices/new">New Invoice</NavItem>
          <NavItem to="/settings">Settings</NavItem>
        </nav>
      </div>
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors [&.active]:bg-primary [&.active]:text-primary-foreground"
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </Link>
  );
}
