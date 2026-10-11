import { Suspense } from "react";
import { CartDrawer } from "@/components/store/cart-drawer";
import { NoticeToast } from "@/components/store/notice-toast";
import { PreviewBanner } from "@/components/store/preview-banner";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { WhatsAppFloat } from "@/components/store/whatsapp-float";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PreviewBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
      <WhatsAppFloat />
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
    </>
  );
}
