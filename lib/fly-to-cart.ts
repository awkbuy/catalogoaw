import { animate } from "framer-motion";

export interface FlyToCartOptions {
  image?: string | null;
  from: HTMLElement | null;
  onComplete?: () => void;
  size?: number;
}

const FLY_SELECTOR = '[aria-label="Abrir carrito"], [aria-label="Carrito"]';

function getCartTargetRect(): DOMRect | null {
  const candidates = document.querySelectorAll<HTMLElement>(FLY_SELECTOR);
  for (const el of Array.from(candidates)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

function pulseCartIcon(): void {
  const target = document.querySelector<HTMLElement>(FLY_SELECTOR);
  if (!target) return;
  const icon = target.querySelector("svg") ?? target;
  animate(icon, { scale: [1, 1.35, 1] }, { duration: 0.45, ease: "easeOut" });
}

export function flyToCart({ image, from, onComplete, size = 56 }: FlyToCartOptions): void {
  const finish = () => onComplete?.();
  if (typeof document === "undefined") {
    finish();
    return;
  }

  const fromRect = from?.getBoundingClientRect();
  const targetRect = getCartTargetRect();
  if (!fromRect || !targetRect) {
    finish();
    return;
  }

  const overlay = document.createElement("div");
  overlay.setAttribute("data-fly-to-cart", "true");
  overlay.style.cssText = [
    `position:fixed`,
    `left:${fromRect.left + fromRect.width / 2 - size / 2}px`,
    `top:${fromRect.top - size / 2}px`,
    `width:${size}px`,
    `height:${size}px`,
    `z-index:9999`,
    `pointer-events:none`,
    `border-radius:50%`,
    `overflow:hidden`,
    `transform-origin:center center`,
    `will-change:transform`,
    `box-shadow:0 8px 30px rgba(0,0,0,0.25)`,
    `border:3px solid #ffffff`,
  ].join(";");

  if (image) {
    const img = document.createElement("img");
    img.src = image;
    img.alt = "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    overlay.appendChild(img);
  } else {
    overlay.style.background = "linear-gradient(135deg,#31D3A9,#0B3B30)";
    overlay.innerHTML =
      '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:28px;">🎲</span>';
  }
  document.body.appendChild(overlay);

  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  const dx = targetX - startX;
  const dy = targetY - startY;

  animate(
    overlay,
    {
      x: [0, dx * 0.7, dx],
      y: [0, dy - 70, dy],
      scale: [0.6, 1.1, 1],
      opacity: [1, 1, 0.95],
    },
    {
      duration: 0.85,
      ease: [0.32, 0.72, 0, 1],
      onComplete: () => {
        overlay.remove();
        pulseCartIcon();
        finish();
      },
    }
  );
}
