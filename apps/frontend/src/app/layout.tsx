'use client';
import { usePathname } from 'next/navigation';
import { StoreProvider } from "@/components/providers/reduxProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayoutWrapper } from "@/components/layout/AppLayoutWrapper";
import { ComponentPropertiesProvider } from "@/contexts/ComponentPropertiesContext";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <StoreProvider>
          <ComponentPropertiesProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </ComponentPropertiesProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't render AppLayout or AuthGuard on login page
  if (pathname === '/login') {
    return <div className="min-h-screen">{children}</div>;
  }

  // For protected routes, wrap with AuthGuard and AppLayout
  return (
    <AuthGuard>
      <AppLayoutWrapper>
        {children}
      </AppLayoutWrapper>
    </AuthGuard>
  );
}
