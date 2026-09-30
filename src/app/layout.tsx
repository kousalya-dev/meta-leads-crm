import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leads | Meta Leads CRM" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">Moopens Energy Solutions Pvt Ltd</div>
            <nav>
              <div className="section">CRM</div>
              <a className="nav active">Leads</a>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
