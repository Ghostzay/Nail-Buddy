import type { Metadata } from "next";

import { RequestKiosk } from "@/components/request/request-kiosk";

export const metadata: Metadata = {
  title: "New Request | Nail Buddy",
};

export default function RequestPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <RequestKiosk />
    </div>
  );
}
