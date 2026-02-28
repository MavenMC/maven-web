import "./globals.css";
import NavbarConditional from "@/components/NavbarConditional";
import Footer from "@/components/Footer";
import Providers from "./providers";
import { getSiteAnnouncement } from "@/lib/site-data";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getSiteAnnouncement();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <div className="page">
            {announcement && (
              <div className="top-announce" role="status">
                {announcement.title}
                {announcement.highlight && (
                  <span className="announce-highlight">{announcement.highlight}</span>
                )}
                {announcement.ip_text && <span className="announce-ip">{announcement.ip_text}</span>}
              </div>
            )}
            <NavbarConditional />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
