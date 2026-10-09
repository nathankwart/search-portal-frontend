const OEM = ["OEM", "ODM", "OBM", "CMT"] as const;

export const SELLER_TYPES = [
  "super_factory",
  "shili_factory",
  "yuantou_flagship",
  "shili",
  "normal_factory",
  "normal",
] as const;

const SELLER_LABELS: Record<string, string> = {
  super_factory: "Super Factory",
  shili_factory: "Verified Factory",
  yuantou_flagship: "Source Flagship",
  shili: "Verified Seller",
  normal_factory: "Factory",
  normal: "Seller",
};

const INQUIRY_LABELS: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In review",
  sent_to_suppliers: "Sent to suppliers",
  quoted: "Quoted",
  closed: "Closed",
  cancelled: "Cancelled",
};

export function sellerLabel(value: string | null | undefined): string {
  if (!value) return "Seller";
  return SELLER_LABELS[value] ?? value;
}

export function inquiryLabel(value: string | null | undefined): string {
  if (!value) return "Submitted";
  return INQUIRY_LABELS[value] ?? value;
}

export function isOemMode(value: string): value is (typeof OEM)[number] {
  return (OEM as readonly string[]).includes(value);
}

export const OEM_MODES = OEM;
