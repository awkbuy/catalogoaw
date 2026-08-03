"use client";

import type { ComponentType } from "react";
import {
  CreditCard,
  Truck,
  Banknote,
  Landmark,
  Wallet,
  Store,
  Smartphone,
  PiggyBank,
  BadgePercent,
  CircleDollarSign,
  HandCoins,
  Coins,
  ReceiptText,
  QrCode,
} from "lucide-react";
import {
  BrandIconVisa,
  BrandIconMastercard,
  BrandIconMercadoPago,
  BrandIconSantander,
} from "@/components/PaymentBrandIcons";

type IconProps = { size?: number; className?: string };
export type PaymentIconComponent = ComponentType<IconProps>;

export const BRAND_ICONS: Record<string, PaymentIconComponent> = {
  visa: BrandIconVisa,
  mastercard: BrandIconMastercard,
  mercado_pago: BrandIconMercadoPago,
  santander: BrandIconSantander,
};

export const BRAND_ICON_KEYS = Object.keys(BRAND_ICONS);

export const PAYMENT_ICONS: Record<string, PaymentIconComponent> = {
  credit_card: CreditCard,
  truck: Truck,
  banknote: Banknote,
  landmark: Landmark,
  wallet: Wallet,
  store: Store,
  smartphone: Smartphone,
  piggy_bank: PiggyBank,
  badge_percent: BadgePercent,
  circle_dollar: CircleDollarSign,
  hand_coins: HandCoins,
  coins: Coins,
  receipt: ReceiptText,
  qr_code: QrCode,
  ...BRAND_ICONS,
};

export default function PaymentMethodIcon({
  icono,
  size = 14,
  className,
}: {
  icono: string;
  size?: number;
  className?: string;
}) {
  const Icon = PAYMENT_ICONS[icono] || CreditCard;
  return <Icon size={size} className={className} />;
}
