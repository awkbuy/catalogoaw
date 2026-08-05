"use client";

import Image from "next/image";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ImageProps = ComponentProps<typeof Image> & { imgClassName?: string };

export default function ImageWithProgress({
  className,
  imgClassName,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative inline-block overflow-hidden", className)}>
      <Image
        {...props}
        className={cn(
          "block transition-opacity duration-300",
          imgClassName,
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={(e) => {
          setLoaded(true);
          props.onLoad?.(e);
        }}
      />
      {!loaded && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/10">
          <div className="h-full w-full origin-left animate-[progress-indeterminate_1.2s_ease-in-out_infinite] bg-[#31D3A9]" />
        </div>
      )}
    </div>
  );
}
