import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SandboxBanner from "@/components/SandboxBanner";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
      <SandboxBanner />
    </div>
  );
}
