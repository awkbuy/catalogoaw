"use client";

import { Toaster } from "sileo";

export default function ToasterProvider() {
  return <Toaster position="top-center" offset={{ top: 16 }} />;
}
