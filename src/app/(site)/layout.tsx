import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StickyCta } from "@/components/sticky-cta";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="shop-wash" aria-hidden="true" />
      <Header />
      <main className="relative z-10 pb-24 md:pb-0">{children}</main>
      <Footer />
      <StickyCta />
    </>
  );
}
