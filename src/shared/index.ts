// API contracts shipped with this app so deploys do not depend on the sibling backend repo.
import { z } from "zod";

export const currencySchema = z.enum(["CNY", "USD", "GHS"]);
export const oemModeSchema = z.enum(["OEM", "ODM", "OBM", "CMT"]);
export const roleSchema = z.enum(["admin", "buyer"]);

export const errorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "AI_UNAVAILABLE",
  "INTERNAL",
]);

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
    requestId: z.string(),
  }),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  });
}

export const searchFiltersSchema = z.object({
  categoryIds: z.array(z.string().uuid()).optional(),
  provinces: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  sellerTypes: z.array(z.string()).optional(),
  oemModes: z.array(oemModeSchema).optional(),
  minRating: z.number().min(0).max(5).optional(),
  verifiedOnly: z.boolean().optional(),
  enrichedOnly: z.boolean().optional(),
  hasPrice: z.boolean().optional(),
});

export const searchFilterKeySchema = searchFiltersSchema.keyof();

export const searchRequestSchema = z.object({
  q: z.string().trim().min(1).max(300),
  filters: searchFiltersSchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sessionId: z.string().trim().min(1).max(100),
  suppressedFilters: z.array(searchFilterKeySchema).optional(),
});

export const supplierSummarySchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  province: z.string().nullable(),
  city: z.string().nullable(),
  sellerType: z.string().nullable(),
  isVerifiedFactory: z.boolean().nullable(),
  businessModel: z.string().nullable(),
  customerStar: z.number().nullable(),
  repeatBuyerRate: z.number().nullable(),
  yearsOnPlatform: z.number().nullable(),
  oemModes: z.array(z.string()),
  trustScore: z.number().nullable(),
  logoUrl: z.string().nullable(),
  shopUrl: z.string().nullable(),
});

export const productCardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  categoryName: z.string().nullable(),
  imageUrl: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  currency: currencySchema.nullable(),
  moq: z.number().nullable(),
  unit: z.string().nullable(),
  isEnriched: z.boolean(),
  supplier: supplierSummarySchema,
  score: z.number(),
  matchReason: z.string(),
});

export const searchResponseSchema = z.object({
  searchEventId: z.string().uuid(),
  query: z.string(),
  correctedQuery: z.string().nullable(),
  notesForUser: z.string().nullable(),
  appliedFilters: searchFiltersSchema,
  aiInferredFilters: z.array(searchFilterKeySchema),
  aiUsed: z.boolean(),
  products: z.array(productCardSchema),
  suppliers: z.array(supplierSummarySchema),
  facets: z.object({
    categories: z.array(z.object({ id: z.string().uuid(), name: z.string(), count: z.number() })),
    provinces: z.array(z.object({ value: z.string(), count: z.number() })),
    sellerTypes: z.array(z.object({ value: z.string(), count: z.number() })),
  }),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  latencyMs: z.number().int(),
});

export const photoSchema = z.object({
  type: z.string(),
  url: z.string(),
});

export const equipmentSchema = z.object({
  equipName: z.string().optional(),
  equipVersion: z.string().optional(),
  brand: z.string().optional(),
  equipNum: z.string().optional(),
  personCount: z.string().optional(),
});

export const reviewLabelSchema = z.object({
  label: z.string(),
  count: z.number().nullable(),
});

export const supplierDetailSchema = supplierSummarySchema.extend({
  district: z.string().nullable(),
  fullAddress: z.string().nullable(),
  contactName: z.string().nullable(),
  mobile: z.string().nullable(),
  telephone: z.string().nullable(),
  lng: z.number().nullable(),
  lat: z.number().nullable(),
  foundedDate: z.string().nullable(),
  mainCategoryRaw: z.string().nullable(),
  mainCategoryId: z.string().uuid().nullable(),
  productionService: z.string().nullable(),
  mainIndustries: z.array(z.string()),
  tags: z.array(z.string()),
  guaranteeTags: z.array(z.string()),
  fulfillmentRate: z.number().nullable(),
  creditLevel: z.string().nullable(),
  aftersalesRating: z.number().nullable(),
  productRating: z.number().nullable(),
  deliveryRating: z.number().nullable(),
  customerServiceRating: z.number().nullable(),
  followersCount: z.number().nullable(),
  factoryMedal: z.string().nullable(),
  photos: z.array(photoSchema),
  businessLicenseUrl: z.string().nullable(),
  deepAuthInfo: z.string().nullable(),
  onsaleCategories: z.array(z.string()),
  onsaleProductsTotal: z.number().nullable(),
  annualRevenueBand: z.string().nullable(),
  annualTradeVolumeBand: z.string().nullable(),
  monthlyOutputBand: z.string().nullable(),
  factoryAreaM2: z.number().nullable(),
  employeesCount: z.number().nullable(),
  productionEmployeesCount: z.number().nullable(),
  rdStaffCount: z.number().nullable(),
  brands: z.array(z.string()),
  certifications: z.array(z.string()),
  patentCount: z.number().nullable(),
  processingCapacity: z.string().nullable(),
  keyClients: z.string().nullable(),
  technologyTypes: z.array(z.string()),
  positiveReviewRate: z.number().nullable(),
  reviewLabels: z.array(reviewLabelSchema),
  mainEquipment: z.array(equipmentSchema),
  specialProcesses: z.array(z.string()),
  socialCreditCode: z.string().nullable(),
  registeredAddress: z.string().nullable(),
  registeredName: z.string().nullable(),
  legalForm: z.string().nullable(),
  legalRepresentative: z.string().nullable(),
  registrationCheckYear: z.number().nullable(),
  registrationStartDate: z.string().nullable(),
  registrationEndText: z.string().nullable(),
  registrationAuthority: z.string().nullable(),
  businessScope: z.string().nullable(),
  registeredCapitalText: z.string().nullable(),
  verificationProvider: z.string().nullable(),
  rankLabel: z.string().nullable(),
  summary: z.string().nullable(),
  externalMemberId: z.string(),
  externalCompanyId: z.string().nullable(),
  source: z.enum(["1688", "manual"]),
  status: z.enum(["active", "hidden"]),
  adminNotes: z.string().nullable(),
  raw: z.unknown().nullable(),
  productCount: z.number().int().optional(),
});

export const imageSchema = z.object({
  url: z.string(),
  storagePath: z.string().optional(),
  alt: z.string().optional(),
});

export const specSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const productDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().nullable(),
  source: z.enum(["imported_offering", "admin"]),
  originField: z.enum(["production_service", "onsale_products_cates"]).nullable(),
  images: z.array(imageSchema),
  imageUrl: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  currency: currencySchema.nullable(),
  moq: z.number().nullable(),
  unit: z.string().nullable(),
  specs: z.array(specSchema),
  tags: z.array(z.string()),
  status: z.enum(["active", "draft", "hidden"]),
  isEnriched: z.boolean(),
  supplier: supplierDetailSchema.omit({ raw: true, adminNotes: true }),
});

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().uuid().nullable(),
  productCount: z.number().int(),
});

export const cartItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  imageUrl: z.string().nullable(),
  quantity: z.number(),
  unit: z.string().nullable(),
  targetPrice: z.number().nullable(),
  targetCurrency: currencySchema.nullable(),
  notes: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  currency: currencySchema.nullable(),
  categoryName: z.string().nullable(),
});

export const cartGroupSchema = z.object({
  supplier: supplierSummarySchema,
  items: z.array(cartItemSchema),
});

export const cartSchema = z.object({
  groups: z.array(cartGroupSchema),
  itemCount: z.number().int(),
  supplierCount: z.number().int(),
});

export const cartItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().trim().max(40).optional(),
  targetPrice: z.number().nonnegative().optional(),
  targetCurrency: currencySchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const cartItemPatchSchema = cartItemInputSchema.omit({ productId: true }).partial();

export const inquiryItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().nullable(),
  supplierId: z.string().uuid().nullable(),
  snapshot: z.record(z.unknown()),
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  targetPrice: z.number().nullable(),
  targetCurrency: z.string().nullable(),
  notes: z.string().nullable(),
  productChanged: z.boolean(),
});

export const inquiryStatusSchema = z.enum([
  "submitted",
  "in_review",
  "sent_to_suppliers",
  "quoted",
  "closed",
  "cancelled",
]);

export const inquirySchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  userId: z.string().uuid(),
  status: inquiryStatusSchema,
  buyerNote: z.string().nullable(),
  destination: z.string().nullable(),
  neededBy: z.string().nullable(),
  adminNotes: z.string().nullable(),
  createdAt: z.string(),
  itemCount: z.number().int().optional(),
  supplierCount: z.number().int().optional(),
  buyerName: z.string().nullable().optional(),
  buyerEmail: z.string().nullable().optional(),
  groups: z
    .array(
      z.object({
        supplierId: z.string().uuid().nullable(),
        supplierName: z.string().nullable(),
        province: z.string().nullable(),
        city: z.string().nullable(),
        contactName: z.string().nullable(),
        mobile: z.string().nullable(),
        shopUrl: z.string().nullable(),
        items: z.array(inquiryItemSchema),
      }),
    )
    .optional(),
});

export const inquiryCreateSchema = z.object({
  buyerNote: z.string().trim().max(4000).optional(),
  destination: z.string().trim().max(200).optional(),
  neededBy: z.string().date().optional(),
});

export const inquiryPatchSchema = z.object({
  status: inquiryStatusSchema.optional(),
  adminNotes: z.string().trim().max(4000).nullable().optional(),
});

export const interactionEventSchema = z.object({
  searchEventId: z.string().uuid().optional(),
  sessionId: z.string().trim().min(1).max(100),
  eventType: z.enum([
    "result_click",
    "product_view",
    "supplier_view",
    "cart_add",
    "cart_remove",
    "inquiry_submit",
    "shop_link_click",
    "contact_copy",
  ]),
  productId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  position: z.number().int().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const eventsBatchSchema = z.object({
  events: z.array(interactionEventSchema).min(1).max(50),
});

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  role: roleSchema,
  fullName: z.string().nullable(),
  phone: z.string().nullable(),
  companyName: z.string().nullable(),
  country: z.string().nullable(),
});

export const profilePatchSchema = z.object({
  fullName: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  companyName: z.string().trim().max(200).optional(),
});

export const publicSettingsSchema = z.object({
  publicSearch: z.boolean(),
  allowBuyerSignup: z.boolean(),
  exchangeRates: z.object({
    base: z.literal("CNY"),
    USD: z.number().nullable(),
    GHS: z.number().nullable(),
    updatedAt: z.string().nullable(),
  }),
});

export const rankingWeightsSchema = z
  .object({
    text: z.number().min(0).max(1),
    vector: z.number().min(0).max(1),
    trust: z.number().min(0).max(1),
    popularity: z.number().min(0).max(1),
  })
  .refine((w) => Math.abs(w.text + w.vector + w.trust + w.popularity - 1) < 0.001, {
    message: "Ranking weights must sum to 1",
  });

export const appSettingsSchema = z.object({
  rankingWeights: rankingWeightsSchema,
  exchangeRates: publicSettingsSchema.shape.exchangeRates,
  synonymsVersion: z.number().int(),
  publicSearch: z.boolean(),
});

export const appSettingsPatchSchema = z.object({
  rankingWeights: rankingWeightsSchema.optional(),
  exchangeRates: z
    .object({
      USD: z.number().positive().nullable().optional(),
      GHS: z.number().positive().nullable().optional(),
    })
    .optional(),
  publicSearch: z.boolean().optional(),
});

export const importIssueSchema = z.object({
  row: z.number().int().nullable(),
  field: z.string().nullable(),
  message: z.string(),
});

export const importBatchSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().nullable(),
  status: z.enum(["uploaded", "validated", "importing", "completed", "failed"]),
  rowsTotal: z.number().int(),
  rowsProcessed: z.number().int(),
  suppliersCreated: z.number().int(),
  suppliersUpdated: z.number().int(),
  productsCreated: z.number().int(),
  productsHidden: z.number().int(),
  rowsFailed: z.number().int(),
  warnings: z.array(importIssueSchema),
  errors: z.array(importIssueSchema),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const importPreviewSchema = importBatchSchema.extend({
  headerMapping: z.array(
    z.object({
      source: z.string(),
      target: z.string().nullable(),
      status: z.enum(["mapped", "unknown"]),
    }),
  ),
  sampleSuppliers: z.array(
    z.object({
      companyName: z.string(),
      province: z.string().nullable(),
      city: z.string().nullable(),
      sellerType: z.string().nullable(),
      mainCategory: z.string().nullable(),
      customerStar: z.number().nullable(),
      repeatBuyerRate: z.number().nullable(),
    }),
  ),
  sampleProducts: z.array(
    z.object({
      name: z.string(),
      supplierName: z.string(),
      originField: z.string(),
    }),
  ),
  missingRequiredHeaders: z.array(z.string()),
});

export const importCommitSchema = z.object({
  mode: z.enum(["upsert", "insert_only"]).default("upsert"),
  generateProducts: z.boolean().default(true),
  runEmbeddings: z.boolean().default(true),
});

export const adminSupplierInputSchema = z.object({
  companyName: z.string().trim().min(1).max(300),
  isVerifiedFactory: z.boolean().nullable().optional(),
  sellerType: z.string().trim().max(80).nullable().optional(),
  province: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  district: z.string().trim().max(120).nullable().optional(),
  fullAddress: z.string().trim().max(500).nullable().optional(),
  contactName: z.string().trim().max(200).nullable().optional(),
  mobile: z.string().trim().max(40).nullable().optional(),
  telephone: z.string().trim().max(40).nullable().optional(),
  lng: z.number().nullable().optional(),
  lat: z.number().nullable().optional(),
  mainCategoryId: z.string().uuid().nullable().optional(),
  productionService: z.string().max(8000).nullable().optional(),
  summary: z.string().max(20000).nullable().optional(),
  shopUrl: z.string().trim().max(500).nullable().optional(),
  oemModes: z.array(oemModeSchema).optional(),
  status: z.enum(["active", "hidden"]).optional(),
  adminNotes: z.string().max(4000).nullable().optional(),
  businessModel: z.string().trim().max(120).nullable().optional(),
});

export const adminSupplierPatchSchema = adminSupplierInputSchema.partial();

export const adminProductFieldsSchema = z.object({
  supplierId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(8000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  priceMin: z.number().nonnegative().nullable().optional(),
  priceMax: z.number().nonnegative().nullable().optional(),
  currency: currencySchema.optional(),
  moq: z.number().positive().nullable().optional(),
  unit: z.string().trim().max(40).nullable().optional(),
  specs: z.array(specSchema).optional(),
  tags: z.array(z.string().trim().min(1).max(80)).optional(),
  status: z.enum(["active", "draft", "hidden"]).optional(),
  images: z.array(imageSchema).max(8).optional(),
});

export const adminProductInputSchema = adminProductFieldsSchema.refine(
  (v) => v.priceMax == null || v.priceMin == null || v.priceMax >= v.priceMin,
  { message: "priceMax must be greater than or equal to priceMin", path: ["priceMax"] },
);

export const adminProductPatchSchema = adminProductFieldsSchema.partial().omit({ supplierId: true });

export const productBulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  action: z.enum(["hide", "activate", "setCategory"]),
  categoryId: z.string().uuid().optional(),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
});

export const categoryMergeSchema = z.object({
  targetId: z.string().uuid(),
});

export const synonymSchema = z.object({
  id: z.string().uuid(),
  term: z.string(),
  expansions: z.array(z.string()),
  categoryId: z.string().uuid().nullable(),
  isActive: z.boolean(),
});

export const synonymInputSchema = z.object({
  term: z.string().trim().min(1).max(200),
  expansions: z.array(z.string().trim().min(1).max(200)).min(1),
  categoryId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const synonymSuggestionSchema = z.object({
  id: z.string().uuid(),
  term: z.string(),
  suggestedExpansions: z.array(z.string()),
  suggestedCategoryId: z.string().uuid().nullable(),
  reason: z.enum(["zero_results", "low_ctr", "manual"]),
  evidence: z.unknown().nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const suggestionApproveSchema = z.object({
  term: z.string().trim().min(1).max(200).optional(),
  expansions: z.array(z.string().trim().min(1)).min(1).optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export const overviewStatsSchema = z.object({
  suppliers: z.number().int(),
  products: z.number().int(),
  enrichedProducts: z.number().int(),
  searchesToday: z.number().int(),
  searches7d: z.number().int(),
  zeroResultRate7d: z.number(),
  openInquiries: z.number().int(),
  embeddingBacklog: z.object({
    pending: z.number().int(),
    failed: z.number().int(),
  }),
});

export const analyticsSearchReportSchema = z.object({
  totalSearches: z.number().int(),
  uniqueQueries: z.number().int(),
  zeroResultRate: z.number(),
  clickThroughRate: z.number(),
  cartAddRate: z.number(),
  inquiryConversion: z.number(),
  daily: z.array(z.object({ date: z.string(), searches: z.number().int() })),
  topQueries: z.array(
    z.object({
      query: z.string(),
      searches: z.number().int(),
      avgResults: z.number(),
      ctr: z.number(),
    }),
  ),
  zeroResultQueries: z.array(z.object({ query: z.string(), searches: z.number().int() })),
  lowCtrQueries: z.array(
    z.object({ query: z.string(), searches: z.number().int(), clicks: z.number().int(), ctr: z.number() }),
  ),
  funnel: z.object({
    searches: z.number().int(),
    clicks: z.number().int(),
    cartAdds: z.number().int(),
    inquiries: z.number().int(),
  }),
});

export const analyticsProductReportSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().uuid().nullable(),
      name: z.string().nullable(),
      views: z.number().int(),
      clicks: z.number().int(),
      cartAdds: z.number().int(),
      inquiries: z.number().int(),
    }),
  ),
  suppliers: z.array(
    z.object({
      supplierId: z.string().uuid().nullable(),
      name: z.string().nullable(),
      views: z.number().int(),
      clicks: z.number().int(),
      cartAdds: z.number().int(),
      inquiries: z.number().int(),
    }),
  ),
});

export const userAdminSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  fullName: z.string().nullable(),
  role: roleSchema,
  isDisabled: z.boolean(),
  createdAt: z.string(),
});

export const userInviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(200),
  role: roleSchema,
});

export const userPatchSchema = z.object({
  role: roleSchema.optional(),
  isDisabled: z.boolean().optional(),
});

export const embeddingsStatusSchema = z.object({
  semanticSearchEnabled: z.boolean(),
  products: z.object({ pending: z.number().int(), done: z.number().int(), failed: z.number().int() }),
  suppliers: z.object({ pending: z.number().int(), done: z.number().int(), failed: z.number().int() }),
});

export const embeddingsRunSchema = z.object({
  reembedAll: z.boolean().optional(),
});

export const rewriteSchema = z.object({
  intent: z.enum(["product", "supplier", "mixed"]),
  product_terms: z.array(z.string()),
  expanded_terms: z.array(z.string()),
  category_names: z.array(z.string()),
  supplier_name: z.string().nullable(),
  filters: z.object({
    provinces: z.array(z.string()),
    oem_modes: z.array(z.string()),
    seller_types: z.array(z.string()),
    min_rating: z.number().nullable(),
    verified_only: z.boolean(),
  }),
  corrected_query: z.string(),
  notes_for_user: z.string().nullable(),
});

export const healthSchema = z.object({
  status: z.literal("ok"),
  db: z.enum(["ok", "error"]),
  time: z.string(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type SupplierSummary = z.infer<typeof supplierSummarySchema>;
export type SupplierDetail = z.infer<typeof supplierDetailSchema>;
export type ProductCard = z.infer<typeof productCardSchema>;
export type ProductDetail = z.infer<typeof productDetailSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type Inquiry = z.infer<typeof inquirySchema>;
export type InquiryItem = z.infer<typeof inquiryItemSchema>;
export type InteractionEvent = z.infer<typeof interactionEventSchema>;
export type ImportBatch = z.infer<typeof importBatchSchema>;
export type ImportPreview = z.infer<typeof importPreviewSchema>;
export type AdminSupplierInput = z.infer<typeof adminSupplierInputSchema>;
export type AdminProductInput = z.infer<typeof adminProductInputSchema>;
export type Synonym = z.infer<typeof synonymSchema>;
export type SynonymSuggestion = z.infer<typeof synonymSuggestionSchema>;
export type AnalyticsSearchReport = z.infer<typeof analyticsSearchReportSchema>;
export type AnalyticsProductReport = z.infer<typeof analyticsProductReportSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type OverviewStats = z.infer<typeof overviewStatsSchema>;
export type UserAdmin = z.infer<typeof userAdminSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type Rewrite = z.infer<typeof rewriteSchema>;
export type PublicSettings = z.infer<typeof publicSettingsSchema>;
export type Profile = z.infer<typeof profileSchema>;

export {
  suggestQuerySchema,
  supplierListQuerySchema,
  productListQuerySchema,
  dateRangeQuerySchema,
  inquiryListQuerySchema,
  suggestionListQuerySchema,
} from "./queries";
