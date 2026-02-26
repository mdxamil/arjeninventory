import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { CopyProvider } from "./context/CopyContext";
import { Providers } from "./providers";
import LayoutContent from "./components/LayoutContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Arjen Inventory",
    template: "%s | Arjen Inventory",
  },
  description:
    "Administrative dashboard for managing products, currency exchange rates, and platform operations.",
  applicationName: "Arjen Inventory",
  keywords: ["admin", "dashboard", "management", "currency", "exchange rate", "products"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AuthProvider>
            <CopyProvider>
              <LayoutContent>
                {children}
              </LayoutContent>
            </CopyProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}