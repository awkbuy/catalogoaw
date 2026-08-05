"use client";

import { type CSSProperties, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useAdaptive } from "@/lib/adaptive-context";

type MotionProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  initial?: Record<string, unknown> | string;
  animate?: Record<string, unknown> | string;
  exit?: Record<string, unknown> | string;
  transition?: Record<string, unknown>;
  whileInView?: Record<string, unknown>;
  whileHover?: Record<string, unknown>;
  whileTap?: Record<string, unknown>;
  viewport?: Record<string, unknown>;
  layout?: boolean;
  layoutId?: string;
  variants?: Record<string, unknown>;
  onAnimationComplete?: () => void;
  onClick?: (e: unknown) => void;
  onMouseMove?: (e: unknown) => void;
  onMouseLeave?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  ref?: unknown;
  role?: string;
  "aria-label"?: string;
  tabIndex?: number;
  id?: string;
  [key: string]: unknown;
};

const MOTION_KEYS: readonly string[] = [
  "initial",
  "animate",
  "exit",
  "transition",
  "whileInView",
  "whileHover",
  "whileTap",
  "viewport",
  "layout",
  "layoutId",
  "variants",
  "onAnimationComplete",
  "onHoverStart",
  "onHoverEnd",
  "onMouseMove",
  "onMouseLeave",
];

function toCssProps(props: MotionProps): Record<string, unknown> {
  const rest: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_KEYS.includes(key)) {
      rest[key] = value;
    }
  }
  return rest;
}

function stripBlur(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripBlur(item));
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (key === "filter" && typeof val === "string" && val.includes("blur")) {
      result[key] = "blur(0px)";
    } else {
      result[key] = stripBlur(val);
    }
  }
  return result;
}

function motionTag(Tag: ElementType): ElementType {
  return (motion as unknown as Record<string, unknown>)[
    Tag as string
  ] as ElementType;
}

function createMotionWrapper(Tag: ElementType) {
  return function AdaptiveMotion(props: MotionProps) {
    const { isLite, isBalanced, isPremium } = useAdaptive();

    // Premium (o profile aún no detectado): comportamiento motion completo
    if (isPremium || (!isLite && !isBalanced)) {
      const MotionTag = motionTag(Tag);
      return <MotionTag {...props} />;
    }

    // Lite: tag HTML normal, sin animaciones
    if (isLite) {
      return <Tag {...toCssProps(props)} />;
    }

    // Balanced: motion pero sin blur filters en variants
    const MotionTag = motionTag(Tag);
    return (
      <MotionTag
        {...props}
        initial={stripBlur(props.initial)}
        animate={stripBlur(props.animate)}
        exit={stripBlur(props.exit)}
        variants={props.variants ? stripBlur(props.variants) : props.variants}
      />
    );
  };
}

export const Motion = {
  div: createMotionWrapper("div"),
  nav: createMotionWrapper("nav"),
  a: createMotionWrapper("a"),
  button: createMotionWrapper("button"),
  article: createMotionWrapper("article"),
  section: createMotionWrapper("section"),
  span: createMotionWrapper("span"),
  p: createMotionWrapper("p"),
  h1: createMotionWrapper("h1"),
  h2: createMotionWrapper("h2"),
  h3: createMotionWrapper("h3"),
};
