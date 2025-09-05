import { Suspense } from "react";
import { SharePage } from "@/components/SharePage";

export default function Share() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharePage />
    </Suspense>
  );
}
