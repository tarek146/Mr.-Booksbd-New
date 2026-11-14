export type ProductType = 'book' | 'stationery';

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Paperback", "Hardcover", "Standard Pack"
  price: number;
  previousPrice?: number;
  stock: number;
  sku: string;
  image?: string;
  description?: string;
}

export interface BookPreviewPage {
  id: string;
  pageNumber: number;
  title?: string;
  content?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  type: ProductType;
  title: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  language?: string;
  pages?: number;
  edition?: string;
  seriesName?: string;
  seriesNumber?: string;
  brand?: string; // for stationery
  material?: string;
  dimensions?: string;
  colorModel?: string;
  images: string[];
  price: number; // base or default variant price
  previousPrice?: number;
  stock: number;
  sku: string;
  variants: ProductVariant[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isOriginalBadge?: boolean;
  deliveryEstimate?: string;
  deliveryTimingTitle?: string;
  insideDhakaDelivery?: string;
  outsideDhakaDelivery?: string;
  deliveryTimingNote?: string;
  deliveryTimerHours?: number;
  customBookDetails?: { label: string; value: string }[];
  // Book Preview / "একটু পড়ে দেখুন" (Read Inside & PDF Pages)
  previewHighlightTitle?: string;
  previewHighlightSubtitle?: string;
  previewIntro?: string;
  previewPages?: BookPreviewPage[];
  isActive?: boolean;
  badge?: string;
  highlights?: string[];
  deliveryChargeType?: 'standard' | 'free' | 'custom';
  customDeliveryFee?: number;
  isFreeDelivery?: boolean;
  homeDeliveryFee?: number;
  sundarbanDeliveryFee?: number;
  otherCourierDeliveryFee?: number;
  insideDhakaFee?: number;
  outsideDhakaFee?: number;
  subAreaFee?: number;
  weightNote?: string;
  bookFormat?: 'original' | 'copy' | 'printed' | 'pdf';
  pdfUrl?: string;
  isNewProduct?: boolean;
  specialOfferTitle?: string;
  specialOfferActive?: boolean;
  specialOfferDiscount?: number;
  createdAt: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  variantName: string;
  price: number;
  image: string;
  originalPrice?: number;
  quantity: number;
  stock: number;
  type: ProductType;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  optionalPhone?: string;
  email: string;
  district: string;
  city: string;
  address: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentStatus: 'unpaid' | 'pending_verification' | 'approved' | 'rejected' | 'refunded';
  orderStatus: 'pending' | 'awaiting_payment' | 'awaiting_payment_verification' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  paymentSubmissionId?: string;
  courierId?: string;
  courierName?: string;
  consignmentId?: string | number;
  trackingCode?: string;
  trackingUrl?: string;
  trackingNotes?: string;
  courierDeliveryStatus?: string;
  courierReturnStatus?: string;
  courierCodAmount?: number;
  courierDeliveryType?: 0 | 1;
  courierExchange?: boolean;
  courierSentAt?: number;
  courierLastSyncedAt?: number;
  courierTrackingSteps?: CourierTrackingStep[];
  weightKg?: number;
  codCharge?: number;
  isTrashed?: boolean;
  trashedAt?: number;
}

export interface CourierTrackingStep {
  consignment_id?: number | string;
  tracking_type?: number;
  text: string;
  created_at: string;
}

export interface CourierProviderConfig {
  id: string;
  name: string;
  providerType: 'steadfast' | 'pathao' | 'redx' | 'paperfly' | 'sundarban' | 'custom';
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  clientId?: string;
  storeId?: string;
  webhookUrl?: string;
  isActive: boolean;
  isDefault: boolean;
  sandboxMode?: boolean;
  autoSendOnConfirm?: boolean;
  defaultDeliveryType?: 0 | 1;
  trackingUrlTemplate?: string;
  updatedAt?: number;
}

export interface Subscriber {
  id: string;
  emailOrPhone: string;
  type: 'email' | 'phone';
  subscribedAt: number;
  status: 'active' | 'unsubscribed';
  source?: string;
}

export interface PaymentSubmission {
  id: string;
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  providerId: string;
  providerName: string;
  transactionReference: string;
  senderIdentifier: string; // phone or account
  claimedAmount: number;
  paymentProofUrl?: string;
  status: 'pending_verification' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
}

export type PaymentSubOptionType = 'send_money' | 'payment';

export interface PaymentSubOptionConfig {
  id: PaymentSubOptionType;
  enabled: boolean;
  label: string; // e.g. "সেন্ড মানি" or "পেমেন্ট"
  englishLabel?: string; // e.g. "Send Money" or "Payment"
  subtitle?: string; // e.g. "পার্সোনাল নাম্বারে সেন্ড মানি" or "মার্চেন্ট নাম্বারে পেমেন্ট"
  accountType: 'Personal' | 'Merchant' | 'Agent' | 'None';
  accountName: string;
  accountNumber: string;
  instructions: string;
  qrCodeUrl?: string;
  englishQrCodeUrl?: string;
  bengaliQrCodeUrl?: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string; // e.g. "বিকাশ", "নগদ", "ক্যাশ অন ডেলিভারি"
  englishName?: string; // e.g. "bKash", "Nagad", "Cash on Delivery"
  type: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'cod' | 'bangla_qr';
  subtitle?: string; // e.g. "হাতে পেয়ে মূল্য পরিশোধ", "বিকাশ সেন্ড মানি"
  badgeText?: string; // Optional offer badge set from Admin Panel (empty by default)
  accountName: string;
  accountNumber: string;
  accountType?: 'Personal' | 'Merchant' | 'Agent' | 'None';
  requireTrxId?: boolean;
  requireSenderPhone?: boolean;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  instructions: string;
  isActive: boolean;
  displayOrder: number;
  customOrder?: boolean;
  logoUrl?: string;
  qrCodeUrl?: string;
  englishQrCodeUrl?: string;
  bengaliQrCodeUrl?: string;
  // Dual Payment Sub-Options (Send Money & Payment) manageable from Admin Panel
  sendMoneyOption?: PaymentSubOptionConfig;
  paymentOption?: PaymentSubOptionConfig;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  image?: string;
  showOnHome?: boolean;
}

export interface Author {
  id: string;
  name: string;
  bio: string;
  photoUrl?: string;
  booksCount?: number;
}

export interface Publisher {
  id: string;
  name: string;
  banglaName?: string;
  description?: string;
  logoUrl?: string;
  booksCount?: number;
  establishedYear?: string;
  isFeatured?: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl: string;
  buttonText: string;
  showText?: boolean;
  showButton?: boolean;
  buttonPosition?: 'bottom-left' | 'bottom-center' | 'bottom-right';
  isActive: boolean;
  displayOrder: number;
}

export interface AuditLog {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface FooterPaymentMethod {
  id: string;
  name: string;
  icon: string; // e.g. 'bkash', 'nagad', 'visa', 'mastercard', 'cod'
  isActive: boolean;
}

export interface SocialLinkItem {
  id: string;
  name: string; // e.g. 'Facebook', 'Instagram', 'YouTube', 'TikTok', 'Twitter'
  url: string;
  icon: string;
  isActive: boolean;
}

export interface AnnouncementItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  isActive: boolean;
}

export interface FooterQuickLinkItem {
  id: string;
  label: string;
  page: string;
  isActive: boolean;
}

export interface FooterCategoryLinkItem {
  id: string;
  label: string;
  category: string;
  page?: string;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  insideDhakaCharge: number;
  subAreaCharge?: number;
  outsideDhakaCharge: number;
  freeShippingThreshold: number;
  logoUrl: string;
  footerLogoUrl: string;
  faviconUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  bkashNumber: string;
  nagadNumber: string;
  // Header & Announcement Bar Customizations
  showHeaderIcon?: boolean;
  headerNameColor1?: string;
  headerNameColor2?: string;
  showHeaderTagline?: boolean;
  showHeaderContact?: boolean;
  showAnnouncementBar?: boolean;
  announcementItems?: AnnouncementItem[];
  // Dark Theme & Display Customizations
  enableThemeToggle?: boolean;
  allowDarkMode?: boolean;
  // Skeleton Screen & Instant Loading Performance Customizations
  enableSkeletonLoading?: boolean;
  skeletonAnimationStyle?: 'shimmer' | 'pulse';
  skeletonMaxDurationMs?: number;
  // Firestore Cache-First (getDocFromCache) & Query Snapshot Indexing Customizations
  firestoreFetchStrategy?: 'cache-first' | 'realtime-snapshot' | 'network-first';
  firestoreQueryLimit?: number;
  enableIndexedQuerySnapshots?: boolean;
  // Marketing & Tracking APIs (Facebook Pixel & Conversion API / CAPI)
  facebookPixelId?: string;
  facebookCapiToken?: string;
  facebookCapiEnabled?: boolean;
  facebookTestEventCode?: string;
  facebookTestModeEnabled?: boolean;
  facebookCapiVersion?: string;
  facebookDomainVerification?: string;
  facebookEnableAdvancedMatching?: boolean;
  facebookTrackPageView?: boolean;
  facebookTrackViewContent?: boolean;
  facebookTrackAddToCart?: boolean;
  facebookTrackInitiateCheckout?: boolean;
  facebookTrackAddPaymentInfo?: boolean;
  facebookTrackPurchase?: boolean;
  facebookTrackSearch?: boolean;
  facebookTrackAddToWishlist?: boolean;
  facebookConnectionStatus?: 'connected' | 'disconnected' | 'unverified';
  facebookLastResponseCode?: number;
  facebookLastCheckedAt?: number;
  facebookLastTraceId?: string;
  facebookLastValidationMessage?: string;
  // Homepage Review Display, Slot Replacement & Green Icon Customizations
  showHomeReviewsSection?: boolean;
  homeReviewsSlotReplacement?: 'reviews' | 'trust_features' | 'publishers_spotlight' | 'reading_benefits' | 'off';
  homeReviewIconStyle?: 'heart' | 'verified_shield' | 'thumbs_up' | 'check_badge' | 'sparkles' | 'book_love' | 'star';
  productCardReviewSlotMode?: 'green_rating' | 'publisher_tag' | 'verified_badge' | 'stock_status' | 'off';
  // Homepage Writer / Featured Authors Display & Slot Replacement Customizations
  showHomeWritersSection?: boolean;
  homeWritersSlotReplacement?: 'writers' | 'publishers_spotlight' | 'bestsellers_showcase' | 'trust_features' | 'reading_benefits' | 'off';
  productCardWriterSlotMode?: 'writer_name' | 'publisher_name' | 'category_name' | 'edition_info' | 'delivery_badge' | 'off';
  productImageFitMode?: 'cover' | 'contain';
  gaMeasurementId?: string;
  tiktokPixelId?: string;
  // Footer Customizations
  showFooterIcon?: boolean;
  footerBrandName?: string;
  footerNameColor1?: string;
  footerNameColor2?: string;
  footerBgColor?: string;
  footerCardBgColor?: string;
  footerDarkBgColor?: string;
  footerDarkCardBgColor?: string;
  footerDescription?: string;
  footerPaymentTitle?: string;
  footerPaymentBannerUrl?: string;
  footerQuickLinksTitle?: string;
  footerQuickLinks?: FooterQuickLinkItem[];
  footerCategoriesTitle?: string;
  footerCategoryLinks?: FooterCategoryLinkItem[];
  footerSocialTitle?: string;
  copyrightText?: string;
  footerBottomTagline?: string;
  footerPaymentMethods?: FooterPaymentMethod[];
  socialLinks?: SocialLinkItem[];
  // Footer 4-Option Utility Strip (VIP Club, Tracking, Coupons, Cancel & Exchange Policy)
  showFooterSubscription?: boolean;
  subscriptionTitle?: string;
  subscriptionSubtitle?: string;
  subscriptionDiscountBadge?: string;
  showFooterTracking?: boolean;
  trackingTitle?: string;
  trackingSubtitle?: string;
  showFooterCoupons?: boolean;
  couponsTitle?: string;
  couponsBadge?: string;
  showFooterPolicy?: boolean;
  policyTitle?: string;
  policyBadge?: string;
  cancelExchangePolicyText?: string;
  // Live Chat Widget Settings
  enableLiveChat?: boolean;
  enableLiveChatSound?: boolean;
  liveChatTitle?: string;
  liveChatWelcomeMessage?: string;
  liveChatQuickReplies?: string[];
  liveChatAutoHideSeconds?: number;
  liveChatRequireContactInfo?: boolean;
  liveChatShowEmailField?: boolean;
  // Quick Contact Buttons (Product Detail & Support)
  whatsappNumber?: string;
  callNumber?: string;
  telegramUrl?: string;
  messengerUrl?: string;
  // Delivery & Courier Settings
  sundarbanDeliveryCharge?: number;
  enableSundarbanCourier?: boolean;
  showSundarbanOnCheckout?: boolean;
  hubDeliveryLabel?: string;
  hubDeliverySubtitle?: string;
  enableCheckoutFraudWarning?: boolean;
  cancellationFraudThreshold?: number;
  codPaymentIconUrl?: string;
  onlinePaymentIconUrl?: string;
  sundarbanForcesPrepayment?: boolean;
  extraWeightChargePerKg?: number;
  deliveryNote?: string;
  // Multi-Courier & Steadfast API Integration Settings
  courierProviders?: CourierProviderConfig[];
  defaultCourierId?: string;
  steadfastApiKey?: string;
  steadfastSecretKey?: string;
  steadfastBaseUrl?: string;
  steadfastSandboxMode?: boolean;

  // Shipping Label & Customer Invoice Settings (Admin-managed via Firebase)
  merchantId?: string;
  defaultLabelSize?: '3x3' | '2x3';
  defaultInvoiceSize?: 'A4' | 'A5' | '3in';
  invoiceShowProductImage?: boolean;
  invoiceShowPricingBreakdown?: boolean;
  labelShowItemDetails?: boolean;
  invoiceFooterNote?: string;
  labelLogisticsText?: string;

  // Admin Orders Workspace Preferences (Admin-managed via Firebase)
  ordersDefaultDensity?: 'comfortable' | 'compact';
  ordersShowFraudCheckButton?: boolean;
  ordersShowItemThumbnails?: boolean;

  // Coupons & Storefront Entry Popup Settings (Admin-managed via Firebase)
  couponsInitialized?: boolean;
  dismissedDefaultCouponIds?: string[];
  enableCouponPopup?: boolean;
  couponPopupDelaySeconds?: number;
  couponPopupFrequency?: 'once_per_session' | 'once_per_day' | 'always';

  // Returning Customer Address Autofill Settings
  enableUseOldAddress?: boolean;
  oldAddressButtonLabel?: string;
  showCheckoutCoupons?: boolean;
  showCheckoutProgress?: boolean;
  directOrderIsolatesCart?: boolean;
  allowCheckoutItemRemoval?: boolean;

  // Bangla QR (বাংলা কিউআর) Settings
  enableBanglaQr?: boolean;
  banglaQrImageUrl?: string;
  banglaQrAccountName?: string;
  banglaQrNumber?: string;
  banglaQrInstructions?: string;

  // SEO Settings
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  keywords?: string;

  // Special Offer Section Config
  specialOffer?: SpecialOfferConfig;

  // Dedicated Store Owner / Admin Profile Settings
  adminProfile?: AdminProfile;

  // Dynamic Admin Sidebar Section & Item Serial Ordering (persisted in Firebase settings/general & settings/adminSidebarConfig)
  adminSidebarConfig?: {
    sections: {
      id: string;
      title: string;
      itemIds: string[];
    }[];
    updatedAt?: number;
  };
}

export interface AdminProfile {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  designation?: string;
  bio?: string;
  whatsapp?: string;
  roleTitle?: string;
  updatedAt?: number;
}

export interface SpecialOfferItem {
  productId: string;
  discountPercentage: number;
  soldPercentage: number;
  onlinePaymentOnly?: boolean;
  startTime?: number;
  endTime?: number;
}

export interface SpecialOfferConfig {
  enabled: boolean;
  title: string;
  endTime: number;
  autoRemoveExpired?: boolean;
  showItemCountdown?: boolean;
  items: SpecialOfferItem[];
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: number;
  isVerifiedPurchase?: boolean;
  likesCount?: number;
  lovesCount?: number;
  dislikesCount?: number;
  userReactions?: Record<string, 'like' | 'love' | 'dislike'>;
}

export interface Reel {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  productId?: string;
  viewsCount?: number;
  likesCount?: number;
  isActive: boolean;
  createdAt: number;
}

export type AdminStaffRole = 'manager' | 'employee' | 'support' | 'admin';

export interface AdminStaffMember {
  id: string;
  name: string;
  email: string;
  password: string; // Dynamic admin-managed password
  role: AdminStaffRole;
  permissions: string[]; // List of accessible tab IDs e.g. ['overview', 'orders', 'products', 'categories', 'verifications', 'reviews']
  status: 'active' | 'disabled';
  phone?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  createdBy?: string;
}

export interface HomeConfig {
  showReviews: boolean;
  showAuthors: boolean;
  newArrivalsTitle?: string;
  reviewsSlotReplacement?: 'reviews' | 'trust_features' | 'publishers_spotlight' | 'reading_benefits' | 'off';
  authorsSlotReplacement?: 'writers' | 'publishers_spotlight' | 'bestsellers_showcase' | 'trust_features' | 'reading_benefits' | 'off';
  reviewIconStyle?: 'heart' | 'verified_shield' | 'thumbs_up' | 'check_badge' | 'sparkles' | 'book_love' | 'star';
  productCardReviewSlotMode?: 'green_rating' | 'publisher_tag' | 'verified_badge' | 'stock_status' | 'off';
  productCardWriterSlotMode?: 'writer_name' | 'publisher_name' | 'category_name' | 'edition_info' | 'delivery_badge' | 'off';
  productImageFitMode?: 'cover' | 'contain';
  updatedAt?: number;
}

export type CouponDiscountType = 'percentage' | 'fixed' | 'free_delivery';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number; // % for percentage, BDT for fixed, 0 for free_delivery
  minOrderAmount: number;
  maxDiscountAmount?: number;
  badgeText?: string;
  isActive: boolean;
  startsAt?: number;
  expiresAt?: number;
  firstOrderOnly?: boolean;
  perCustomerLimit?: number;
  usageLimit?: number;
  usageCount?: number;
  showAsPopup?: boolean;
  popupHeadline?: string;
  popupSubtitle?: string;
  popupCtaText?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface LiveChatMessage {
  id: string;
  sender: 'customer' | 'admin' | 'system';
  senderName: string;
  text: string;
  createdAt: number;
}

export type CustomerChatSegment = 'general' | 'vip' | 'order_issue' | 'payment_return' | 'follow_up';

export interface LiveChatSession {
  id: string;
  visitorId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  topic?: string;
  customerSegment?: CustomerChatSegment;
  adminNote?: string;
  status: 'open' | 'resolved';
  unreadByAdmin: number;
  unreadByCustomer: number;
  lastMessageText: string;
  lastMessageAt: number;
  createdAt: number;
  messages: LiveChatMessage[];
}

export interface SiteSettings {
  reviewDisplay: boolean;
  authorInfo: boolean;
  deliveryTimingDisplay?: boolean;
  updatedAt?: number;
}



