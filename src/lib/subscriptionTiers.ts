export const TIERS = {
  premium: {
    price_id: "price_1TLSiH1tkgu9Vsdta6wRLOQR",
    product_id: "prod_UK6w7ttdRAbz7O",
    name: "Premium",
    price: 19,
  },
  business: {
    price_id: "price_1TLSif1tkgu9VsdtB41tOmH7",
    product_id: "prod_UK6w7Mh46Mi7LZ",
    name: "Business",
    price: 99,
  },
} as const;

export type TierKey = keyof typeof TIERS | "free";

export function getTierFromProductId(productId: string | null): TierKey {
  if (!productId) return "free";
  if (productId === TIERS.premium.product_id) return "premium";
  if (productId === TIERS.business.product_id) return "business";
  return "free";
}
