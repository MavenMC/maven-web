import "./globals.css";
import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="bg-[#0b0f16] text-white">
        <Navbar />
        <main className="p-8">{children}</main>
      </body>
    </html>
  );


}
