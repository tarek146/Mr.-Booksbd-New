export type ProductType = 'book' | 'stationery';

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Paperback", "Hardcover", "Standard Pack"
  price: number;
  previousPrice?: number;
  stock: number;
  sku: string;
  image?: string;
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
  brand?: string; // for stationery
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
  createdAt: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  variantName: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  type: ProductType;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  district: string;
  city: string;
  address: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentStatus: 'unpaid' | 'pending_verification' | 'approved' | 'rejected' | 'refunded';
  orderStatus: 'pending' | 'awaiting_payment' | 'awaiting_payment_verification' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  paymentSubmissionId?: string;
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

export interface PaymentMethodConfig {
  id: string;
  name: string; // e.g. "bKash Personal", "Nagad Merchant", "City Bank Transfer"
  type: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'cod';
  accountName: string;
  accountNumber: string;
  accountType?: 'Personal' | 'Merchant' | 'Agent';
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  instructions: string;
  isActive: boolean;
  displayOrder: number;
  logoUrl?: string;
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

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  insideDhakaCharge: number;
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
}
