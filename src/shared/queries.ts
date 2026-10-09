import { z } from "zod";

const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const suggestQuerySchema = z.object({
  q: z.string().optional().default(""),
});

export const supplierListQuerySchema = z.object({
  ...pageQuery,
  q: z.string().optional(),
  province: z.string().optional(),
  sellerType: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["active", "hidden"]).optional(),
  minTrust: z.coerce.number().min(0).max(1).optional(),
});

export const productListQuerySchema = z.object({
  ...pageQuery,
  q: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  source: z.enum(["imported_offering", "admin"]).optional(),
  status: z.enum(["active", "draft", "hidden"]).optional(),
  enriched: z.enum(["true", "false"]).optional(),
  sort: z.enum(["updatedAt", "name", "popularity"]).optional(),
});

export const dateRangeQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const inquiryListQuerySchema = z.object({
  ...pageQuery,
  status: z.string().optional(),
  userId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const suggestionListQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});
