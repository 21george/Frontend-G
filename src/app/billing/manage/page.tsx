"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingManageRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/billing");
  }, [router]);
  return null;
}
