"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Analytics() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const pagePath = pathname + window.location.search;
    const payload = {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", payload);
    } else {
      window.dataLayer?.push({ event: "page_view", ...payload });
    }
  }, [pathname]);

  return null;
}
