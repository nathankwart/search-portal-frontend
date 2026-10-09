import { z } from "zod";
import { categorySchema, inquirySchema, paginatedSchema, productDetailSchema } from "@shared";

export const suggestSchema = z.object({
  suggestions: z.array(z.string()),
});

export const categoryListSchema = z.array(categorySchema);
export const relatedProductsSchema = z.array(productDetailSchema);
export const supplierProductListSchema = paginatedSchema(productDetailSchema);
export const inquiryListSchema = paginatedSchema(inquirySchema);
