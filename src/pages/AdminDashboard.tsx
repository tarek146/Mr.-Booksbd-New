import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  CreditCard, 
  Package, 
  BookOpen, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  DollarSign, 
  TrendingUp,
  Clock,
  Image as ImageIcon,
  Users,
  Upload,
  Eye,
  EyeOff,
  Check,
  Edit2,
  Lock,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Key,
  Server,
  Menu,
  X,
  Layers,
  ChevronRight,
  Calendar,
  RefreshCw,
  Mail,
  Gift,
  Search,
  Copy,
  Truck,
  Flame,
  Film,
  Play,
  Star,
  ThumbsUp,
  ThumbsDown,
  Heart,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Sparkle,
  Phone,
  FileText,
  ShoppingCart,
  Moon,
  Sun,
  QrCode,
  User,
  UserCheck,
  Building2,
  Tag,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  FileSpreadsheet,
  TicketPercent,
  MessageCircle
} from 'lucide-react';
import { BulkProductImportModal } from '../components/BulkProductImportModal';
import { Product, Author, Publisher, Banner, BookPreviewPage, Order, PaymentMethodConfig, PaymentSubOptionConfig, AdminStaffMember, AdminStaffRole, AdminProfile, Review, LiveChatSession } from '../types';
import { DEFAULT_PUBLISHERS_LIST, countBooksForPublisher, parseCustomBookDetails, serializeCustomBookDetails } from '../utils/publisherAndDeliveryHelpers';
import { DEFAULT_PAYMENT_METHODS } from '../firebase';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { AdminStaffManagement } from '../components/admin/AdminStaffManagement';
import { AdminProfileManagement } from '../components/admin/AdminProfileManagement';
import { AdminConversionApiManager } from '../components/admin/AdminConversionApiManager';
import { AdminCouponsManager } from '../components/admin/AdminCouponsManager';
import { AdminLiveChatManager } from '../components/admin/AdminLiveChatManager';
import { DEFAULT_CANCEL_EXCHANGE_POLICY } from '../utils/storeEnhancementsHelpers';
import { detectAdminNewCustomerActivity, playAdminIncomingRingtone, unlockChatAudioContext, DEFAULT_LIVE_CHAT_QUICK_REPLIES } from '../utils/chatSoundAndValidation';
import { resolveDashboardHeaderCapiStatus } from '../utils/facebookCapiHelpers';
import { renderGreenReviewIcon } from '../components/ProductCard';
import { compressImageFile, isValidImageUrl, sanitizeImageUrl } from '../utils/imageCompressor';
import {
  sortPaymentMethods,
  getPaymentMethodDisplayMeta,
  getPaymentMethodSubOptions,
  getDefaultMerchantPaymentInstruction,
} from '../utils/reviewHelpers';
import { PaymentBrandIcon } from '../components/PaymentInstructions';
import {
  movePreviewPage,
  sanitizePreviewPages,
  toBanglaDigits,
} from '../utils/bookPreviewHelpers';
import { extractPdfPreviewPages } from '../utils/pdfPageExtractor';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  isDirectVideoUrl,
  searchProductsForReel,
  captureVideoFrame
} from '../utils/videoReelHelpers';

export function AdminDashboard() {
  const { 
    currentUser, 
    isAdmin, 
    loading: authLoading, 
    signIn, 
    logout, 
    devLoginAsAdmin,
    currentStaff,
    staffRole,
    canAccessTab
  } = useAuth();
  const { 
    orders, 
    paymentSubmissions, 
    paymentMethods, 
    products, 
    banners,
    authors,
    publishers,
    settings, 
    homeConfig,
    reviewPaymentSubmission, 
    updateOrderStatus, 
    updateOrderPaymentStatus,
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod,
    addProduct,
    updateProduct,
    categories,
    deleteProduct,
    addBanner,
    updateBanner,
    deleteBanner,
    addAuthor,
    updateAuthor,
    deleteAuthor,
    addPublisher,
    updatePublisher,
    deletePublisher,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    updateHomeConfig,
    setActivePage,
    subscribers,
    addSubscriber,
    deleteSubscriber,
    updateOrderTracking,
    deleteOrder,
    reels,
    addReel,
    updateReel,
    deleteReel,
    reviews,
    addProductReview,
    updateProductReview,
    deleteProductReview,
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    cacheTelemetry,
    refreshStoreCacheFirst,
    clearLocalStoreCache,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    liveChatSessions,
    liveChatsHydrated,
    replyLiveChatAsAdmin,
    updateLiveChatStatus,
    updateLiveChatMeta,
    markLiveChatReadByAdmin,
    deleteLiveChatSession
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'payment-methods' | 'orders' | 'products' | 'categories' | 'banners' | 'authors' | 'publishers' | 'subscribers' | 'settings' | 'special-offer' | 'reels' | 'reviews' | 'staff' | 'profile' | 'capi' | 'coupons' | 'live-chat'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin Live Chat Sound / Ringtone Alert State
  const [isLiveChatSoundMuted, setIsLiveChatSoundMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.localStorage.getItem('mrb_chat_sound_muted_admin') === '1';
      } catch {
        return false;
      }
    }
    return false;
  });
  const prevLiveChatsRef = useRef<LiveChatSession[] | null>(null);

  useEffect(() => {
    const unlock = () => unlockChatAudioContext();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  useEffect(() => {
    if (!liveChatsHydrated) return;

    if (prevLiveChatsRef.current === null) {
      prevLiveChatsRef.current = liveChatSessions;
      return;
    }

    const activity = detectAdminNewCustomerActivity(prevLiveChatsRef.current, liveChatSessions);
    prevLiveChatsRef.current = liveChatSessions;

    if (activity.hasNewCustomerMessage) {
      if (settings.enableLiveChatSound !== false && !isLiveChatSoundMuted) {
        playAdminIncomingRingtone();
      }
      setToast({
        show: true,
        type: 'success',
        message: `💬 নতুন লাইভ চ্যাট মেসেজ (${activity.latestSession?.customerName || 'Customer'}): ${(activity.latestText || '').slice(0, 60)}`,
      });
    }
  }, [liveChatSessions, liveChatsHydrated, settings.enableLiveChatSound, isLiveChatSoundMuted]);

  const toggleAdminChatSoundMute = () => {
    setIsLiveChatSoundMuted(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem('mrb_chat_sound_muted_admin', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Staff & Team Access Management state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<AdminStaffMember | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'manager' | 'employee' | 'admin'>('all');
  
  // Staff Form state
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormEmail, setStaffFormEmail] = useState('');
  const [staffFormPassword, setStaffFormPassword] = useState('');
  const [staffFormRole, setStaffFormRole] = useState<AdminStaffRole>('manager');
  const [staffFormPermissions, setStaffFormPermissions] = useState<string[]>([
    'overview', 'orders', 'verifications', 'products', 'categories', 'reviews'
  ]);
  const [staffFormStatus, setStaffFormStatus] = useState<'active' | 'disabled'>('active');
  const [staffFormPhone, setStaffFormPhone] = useState('');
  const [staffFormNotes, setStaffFormNotes] = useState('');
  const [showStaffPasswordsMap, setShowStaffPasswordsMap] = useState<Record<string, boolean>>({});
  const [copiedStaffPasswordId, setCopiedStaffPasswordId] = useState<string | null>(null);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Admin Review Management state
  const [adminRevProdId, setAdminRevProdId] = useState('');
  const [adminRevUserName, setAdminRevUserName] = useState('');
  const [adminRevRating, setAdminRevRating] = useState(5);
  const [adminRevComment, setAdminRevComment] = useState('');
  const [showAddAdminRevModal, setShowAddAdminRevModal] = useState(false);

  // Reels management state
  const [showAddReelModal, setShowAddReelModal] = useState(false);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [reelTitle, setReelTitle] = useState('');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelThumbnailUrl, setReelThumbnailUrl] = useState('');
  const [reelProductId, setReelProductId] = useState('');
  const [reelProductSearchQuery, setReelProductSearchQuery] = useState('');
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);
  const [thumbnailSourceNote, setThumbnailSourceNote] = useState('');
  const [isSubmittingReel, setIsSubmittingReel] = useState(false);

  // Subscribers management state
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSubInput, setNewSubInput] = useState('');
  const [newSubMsg, setNewSubMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [copiedSubs, setCopiedSubs] = useState(false);

  // Courier & Order Tracking modal state
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);
  const [courierNameInput, setCourierNameInput] = useState('Steadfast');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [trackingUrlInput, setTrackingUrlInput] = useState('');
  const [trackingNotesInput, setTrackingNotesInput] = useState('');
  const [trackingStatusInput, setTrackingStatusInput] = useState<Order['orderStatus']>('shipped');
  const [trackingSaving, setTrackingSaving] = useState(false);

  // Category management state
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'book' | 'stationery'>('book');
  const [catImage, setCatImage] = useState('');
  const [catShowOnHome, setCatShowOnHome] = useState(true);

  // Banner management state
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState('Exclusive Discount Banner');
  const [bannerSubtitle, setBannerSubtitle] = useState('Get the best discounts on all books & stationery');
  const [bannerImage, setBannerImage] = useState('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=85');
  const [bannerLink, setBannerLink] = useState('/books');
  const [bannerBtnText, setBannerBtnText] = useState('Explore Books');
  const [bannerShowText, setBannerShowText] = useState(false); // default false for direct picture!
  const [bannerShowButton, setBannerShowButton] = useState(true);
  const [bannerBtnPos, setBannerBtnPos] = useState<'bottom-left' | 'bottom-center' | 'bottom-right'>('bottom-left');

  // Author management state
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false);
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [authorPhoto, setAuthorPhoto] = useState('');
  const [authorBooksCount, setAuthorBooksCount] = useState(25);

  // Publisher management state
  const [showAddPublisherModal, setShowAddPublisherModal] = useState(false);
  const [editingPublisherId, setEditingPublisherId] = useState<string | null>(null);
  const [pubName, setPubName] = useState('');
  const [pubBanglaName, setPubBanglaName] = useState('');
  const [pubDescription, setPubDescription] = useState('');
  const [pubLogo, setPubLogo] = useState('');
  const [pubBooksCount, setPubBooksCount] = useState(30);
  const [pubEstYear, setPubEstYear] = useState('');

  // New & Editing Payment Method modal state
  const [showAddPmModal, setShowAddPmModal] = useState(false);
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [pmName, setPmName] = useState('বিকাশ');
  const [pmEnglishName, setPmEnglishName] = useState('bKash');
  const [pmType, setPmType] = useState<'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'cod' | 'bangla_qr'>('bkash');
  const [pmSubtitle, setPmSubtitle] = useState('বিকাশ সেন্ড মানি ও পেমেন্ট');
  const [pmBadgeText, setPmBadgeText] = useState('');
  const [pmAccountType, setPmAccountType] = useState<'Personal' | 'Merchant' | 'Agent' | 'None'>('Personal');
  const [pmAccName, setPmAccName] = useState('MR. BOOKS Official');
  const [pmAccNum, setPmAccNum] = useState('');
  const [pmRequireTrxId, setPmRequireTrxId] = useState(true);
  const [pmRequireSenderPhone, setPmRequireSenderPhone] = useState(true);
  const [pmInst, setPmInst] = useState('');
  const [pmLogoUrl, setPmLogoUrl] = useState('');
  const [pmQrCodeUrl, setPmQrCodeUrl] = useState('');
  const [pmEnglishQrCodeUrl, setPmEnglishQrCodeUrl] = useState('');
  const [pmBengaliQrCodeUrl, setPmBengaliQrCodeUrl] = useState('');
  const [pmBankName, setPmBankName] = useState('');
  const [pmBranchName, setPmBranchName] = useState('');
  const [pmRoutingNumber, setPmRoutingNumber] = useState('');
  const [pmIsActive, setPmIsActive] = useState(true);

  // Dual Sub-Option State: 1. সেন্ড মানি (Send Money) & 2. পেমেন্ট (Payment)
  const [pmEditingSubTab, setPmEditingSubTab] = useState<'send_money' | 'payment'>('send_money');
  const [pmSendMoneyOption, setPmSendMoneyOption] = useState<PaymentSubOptionConfig>({
    id: 'send_money',
    enabled: true,
    label: 'সেন্ড মানি',
    englishLabel: 'Send Money',
    subtitle: 'Personal নম্বরে সেন্ড মানি করুন',
    accountType: 'Personal',
    accountName: 'MR. BOOKS Official',
    accountNumber: '01712345678',
    instructions: 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।',
    qrCodeUrl: '',
    englishQrCodeUrl: '',
    bengaliQrCodeUrl: '',
  });
  const [pmPaymentOption, setPmPaymentOption] = useState<PaymentSubOptionConfig>({
    id: 'payment',
    enabled: true,
    label: 'পেমেন্ট',
    englishLabel: 'Make Payment',
    subtitle: 'Merchant নম্বরে পেমেন্ট করুন',
    accountType: 'Merchant',
    accountName: 'MR. BOOKS Official',
    accountNumber: '01712345678',
    instructions: getDefaultMerchantPaymentInstruction('bkash'),
    qrCodeUrl: '',
    englishQrCodeUrl: '',
    bengaliQrCodeUrl: '',
  });

  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('mr.booksbd700@gmail.com');
  const [adminPassword, setAdminPassword] = useState('booksbd700@');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(settings);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'header' | 'footer' | 'shipping' | 'social' | 'seo' | 'homepage'>('header');

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('dev=1')) {
      if (devLoginAsAdmin && !currentUser) {
        devLoginAsAdmin();
      }
    }
  }, [devLoginAsAdmin, currentUser]);

  // Product modal state
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodType, setProdType] = useState<'book' | 'stationery'>('book');
  const [prodPrice, setProdPrice] = useState(350);
  const [prodCategory, setProdCategory] = useState('Fiction & Literature');
  const [prodAuthor, setProdAuthor] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodExtraImages, setProdExtraImages] = useState('');
  const [prodIsOriginal, setProdIsOriginal] = useState(true);
  const [prodPrintVariants, setProdPrintVariants] = useState('Paperback, Hardcover');
  const [prodDeliveryEstimate, setProdDeliveryEstimate] = useState('২-৩ কার্যদিবস (2-3 Days)');
  const [prodDeliveryTimingTitle, setProdDeliveryTimingTitle] = useState('ডেলিভারি টাইমিং (Delivery Timing)');
  const [prodInsideDhakaDelivery, setProdInsideDhakaDelivery] = useState('২৪-৪৮ ঘণ্টা (১-২ দিন)');
  const [prodOutsideDhakaDelivery, setProdOutsideDhakaDelivery] = useState('২-৩ কার্যদিবস (সারাদেশে)');
  const [prodDeliveryTimingNote, setProdDeliveryTimingNote] = useState('আজকে অর্ডার করলে দ্রুততম সময়ে বাবল-র‍্যাপ প্যাকেজিংসহ কুরিয়ারে পাঠানো হবে।');
  const [prodDeliveryTimerHours, setProdDeliveryTimerHours] = useState<number>(48);
  const [prodPublisher, setProdPublisher] = useState('');
  const [prodIsbn, setProdIsbn] = useState('');
  const [prodEdition, setProdEdition] = useState('3rd Edition');
  const [prodPages, setProdPages] = useState<number>(264);
  const [prodLanguage, setProdLanguage] = useState('Bengali');
  const [prodSku, setProdSku] = useState('');
  const [prodCustomDetailsText, setProdCustomDetailsText] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodMaterial, setProdMaterial] = useState('');
  const [prodDimensions, setProdDimensions] = useState('');
  const [prodColorModel, setProdColorModel] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPreviewHighlightTitle, setProdPreviewHighlightTitle] = useState('বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)');
  const [prodPreviewHighlightSubtitle, setProdPreviewHighlightSubtitle] = useState('');
  const [prodPreviewIntro, setProdPreviewIntro] = useState('');
  const [prodPreviewPages, setProdPreviewPages] = useState<BookPreviewPage[]>([]);
  const [pdfUploading, setPdfUploading] = useState(false);
  
  // Product Type Chooser Modal (1- Stationery vs 2- Books)
  const [showTypeChooserModal, setShowTypeChooserModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Advanced Product Add / Edit States (matching image_c4b27017.png and image_44c07b58.png)
  const [prodSlug, setProdSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [prodRegularPrice, setProdRegularPrice] = useState<number>(450);
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodIsFeatured, setProdIsFeatured] = useState(false);
  const [prodBadge, setProdBadge] = useState('NEW');
  const [prodHighlights, setProdHighlights] = useState<string[]>([
    '১০০% খাঁটি ও আসল মুদ্রিত সংস্করণ',
    'দ্রুততম ক্যাশ অন ডেলিভারি (সারাদেশে হোম ডেলিভারি)',
    'নিরাপদ বাবল-র‍্যাপ প্যাকেজিং ও সহজ রিপ্লেসমেন্ট পলিসি'
  ]);
  const [newHighlightInput, setNewHighlightInput] = useState('');
  const [prodDeliveryChargeType, setProdDeliveryChargeType] = useState<'standard' | 'free' | 'custom'>('standard');
  const [prodCustomDeliveryFee, setProdCustomDeliveryFee] = useState<number>(60);
  const [prodGalleryUrls, setProdGalleryUrls] = useState<string[]>([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [customVariants, setCustomVariants] = useState<{ id: string; name: string; price: number; regularPrice?: number; stock: number; sku: string; description?: string }[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantOfferPrice, setNewVariantOfferPrice] = useState<number | ''>('');
  const [newVariantRegularPrice, setNewVariantRegularPrice] = useState<number | ''>('');
  const [newVariantDescription, setNewVariantDescription] = useState('');

  // Book Format (অরিজিনাল বই নাকি কপি বুক, প্রিন্টেড বুক নাকি পিডিএফ)
  const [prodBookFormat, setProdBookFormat] = useState<'original' | 'copy' | 'printed' | 'pdf'>('original');
  const [prodPdfUrl, setProdPdfUrl] = useState('');

  // Product Classification (নিউ প্রোডাক্ট নাকি নিউ ফিচার প্রোডাক্ট)
  const [prodClassification, setProdClassification] = useState<'new' | 'featured' | 'regular'>('new');

  // Special Offer on this product (কোনো অফার চালাতে চাইলে সেই অফার অ্যাড করার অপশন)
  const [prodSpecialOfferActive, setProdSpecialOfferActive] = useState(false);
  const [prodSpecialOfferTitle, setProdSpecialOfferTitle] = useState('মেগা ডিসকাউন্ট অফার');
  const [prodSpecialOfferDiscount, setProdSpecialOfferDiscount] = useState<number | ''>('');

  // Courier & Delivery Charges per Product
  const [prodIsFreeDelivery, setProdIsFreeDelivery] = useState(false);
  const [prodHomeDeliveryFee, setProdHomeDeliveryFee] = useState<number>(60);
  const [prodInsideDhakaFee, setProdInsideDhakaFee] = useState<number>(60);
  const [prodOutsideDhakaFee, setProdOutsideDhakaFee] = useState<number>(120);
  const [prodSubAreaFee, setProdSubAreaFee] = useState<number>(90);
  const [prodSundarbanDeliveryFee, setProdSundarbanDeliveryFee] = useState<number>(120);
  const [prodOtherCourierDeliveryFee, setProdOtherCourierDeliveryFee] = useState<number>(100);
  const [prodWeightNote, setProdWeightNote] = useState('Weight-based extra charge: ৳20 added per extra kg/item when weight increases.');

  // In-Form Customer Reviews for this product
  const [inFormReviews, setInFormReviews] = useState<{ id: string; userName: string; rating: number; comment: string; isVerifiedPurchase: boolean; createdAt: number }[]>([]);
  const [newRevName, setNewRevName] = useState('');
  const [newRevRating, setNewRevRating] = useState<number>(5);
  const [newRevComment, setNewRevComment] = useState('');
  const [newRevVerified, setNewRevVerified] = useState(true);

  // Writer & Publisher Custom Input Toggles
  const [isCustomAuthorInput, setIsCustomAuthorInput] = useState(false);
  const [isCustomPublisherInput, setIsCustomPublisherInput] = useState(false);
  
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'book' | 'stationery'>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [authorSearchQuery, setAuthorSearchQuery] = useState('');
  const [publisherSearchQuery, setPublisherSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryFilterTab, setCategoryFilterTab] = useState<'all' | 'main' | 'sub' | 'child'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [paymentMfsFilter, setPaymentMfsFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Reject reason modal
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Stats
  const totalRevenue = orders.filter(o => o.paymentStatus === 'approved').reduce((sum, o) => sum + o.total, 0);
  const pendingVerificationsCount = paymentSubmissions.filter(s => s.status === 'pending_verification').length;

  const paymentMetrics = useMemo(() => {
    const approved = paymentSubmissions.filter(s => s.status === 'approved');
    const pending = paymentSubmissions.filter(s => s.status === 'pending_verification');
    const totalCollected = approved.reduce((sum, s) => sum + s.claimedAmount, 0);
    const bkashTotal = approved.filter(s => s.providerName.toLowerCase().includes('bkash')).reduce((sum, s) => sum + s.claimedAmount, 0);
    const nagadTotal = approved.filter(s => s.providerName.toLowerCase().includes('nagad')).reduce((sum, s) => sum + s.claimedAmount, 0);

    return {
      totalCollected,
      completedCount: approved.length,
      pendingCount: pending.length,
      bkashTotal,
      nagadTotal
    };
  }, [paymentSubmissions]);

  // Real-time Save Toast Notification
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error'; message: string } | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerSaving, setBannerSaving] = useState(false);

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const openPmTemplateModal = (template: 'bkash' | 'nagad' | 'rocket' | 'cod' | 'upay' | 'bank' | 'custom') => {
    setEditingPmId(null);
    setPmBadgeText('');
    setPmLogoUrl('');
    setPmQrCodeUrl('');
    setPmEnglishQrCodeUrl('');
    setPmBengaliQrCodeUrl('');
    setPmBankName('');
    setPmBranchName('');
    setPmRoutingNumber('');
    setPmIsActive(true);
    setPmEditingSubTab('send_money');

    let nextType: PaymentMethodConfig['type'] = 'bkash';
    let nextName = 'বিকাশ';
    let nextEn = 'bKash';
    let nextSub = 'বিকাশ সেন্ড মানি ও পেমেন্ট';
    let nextAccType: PaymentMethodConfig['accountType'] = 'Personal';
    let nextAccName = 'MR. BOOKS Official';
    let nextAccNum = '01712345678';
    let nextInst = 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';

    switch (template) {
      case 'bkash':
        nextType = 'bkash';
        nextName = 'বিকাশ';
        nextEn = 'bKash';
        nextSub = 'বিকাশ সেন্ড মানি ও পেমেন্ট';
        nextAccType = 'Personal';
        nextAccName = 'MR. BOOKS Official';
        nextAccNum = '01712345678';
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        nextInst = 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
        break;
      case 'nagad':
        nextType = 'nagad';
        nextName = 'নগদ';
        nextEn = 'Nagad';
        nextSub = 'নগদ সেন্ড মানি ও পেমেন্ট';
        nextAccType = 'Personal';
        nextAccName = 'MR. BOOKS BD';
        nextAccNum = '01812345678';
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        nextInst = 'নগদ অ্যাপ অথবা *167# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
        break;
      case 'rocket':
        nextType = 'rocket';
        nextName = 'রকেট';
        nextEn = 'Rocket';
        nextSub = 'রকেট সেন্ড মানি ও পেমেন্ট';
        nextAccType = 'Personal';
        nextAccName = 'MR. BOOKS Account';
        nextAccNum = '019123456789';
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        nextInst = 'রকেট অ্যাপ অথবা *322# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
        break;
      case 'cod':
        nextType = 'cod';
        nextName = 'ক্যাশ অন ডেলিভারি';
        nextEn = 'Cash on Delivery';
        nextSub = 'হাতে পেয়ে মূল্য পরিশোধ';
        nextAccType = 'None';
        nextAccName = 'Cash on Delivery';
        nextAccNum = 'N/A';
        setPmRequireTrxId(false);
        setPmRequireSenderPhone(false);
        nextInst = 'বই হাতে পেয়ে ডেলিভারি ম্যানের কাছে নগদ অর্থ পরিশোধ করুন।';
        break;
      case 'upay':
        nextType = 'upay';
        nextName = 'উপায়';
        nextEn = 'Upay';
        nextSub = 'উপায় সেন্ড মানি ও পেমেন্ট';
        nextAccType = 'Personal';
        nextAccName = 'MR. BOOKS Official';
        nextAccNum = '01712345678';
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        nextInst = 'উপায় অ্যাপ অথবা *268# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।';
        break;
      case 'bank':
        nextType = 'bank';
        nextName = 'ব্যাংক ট্রান্সফার';
        nextEn = 'Bank Transfer';
        nextSub = 'ব্যাংক একাউন্টে পেমেন্ট';
        nextAccType = 'Merchant';
        nextAccName = 'MR. BOOKS ENTERPRISE';
        nextAccNum = '123-110-456789';
        setPmBankName('Eastern Bank PLC');
        setPmBranchName('Gulshan Branch, Dhaka');
        setPmRoutingNumber('095261234');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        nextInst = 'নির্ধারিত ব্যাংক একাউন্টে মোট টাকার পরিমাণ ট্রান্সফার করে ট্রানজেকশন রেফারেন্স বা রিসিপ্ট আইডি নিচে দিন।';
        break;
      case 'custom':
      default:
        nextType = 'bkash';
        nextName = '';
        nextEn = '';
        nextSub = '';
        nextAccType = 'Personal';
        nextAccName = 'MR. BOOKS';
        nextAccNum = '';
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        nextInst = '';
        break;
    }

    setPmType(nextType);
    setPmName(nextName);
    setPmEnglishName(nextEn);
    setPmSubtitle(nextSub);
    setPmAccountType(nextAccType);
    setPmAccName(nextAccName);
    setPmAccNum(nextAccNum);
    setPmInst(nextInst);

    const resolvedSubs = getPaymentMethodSubOptions({
      id: 'temp',
      name: nextName || 'বিকাশ',
      englishName: nextEn || 'bKash',
      type: nextType,
      accountType: nextAccType,
      accountName: nextAccName,
      accountNumber: nextAccNum,
      instructions: nextInst,
      isActive: true,
      displayOrder: 1,
    });
    setPmSendMoneyOption(resolvedSubs.sendMoneyOption);
    setPmPaymentOption(resolvedSubs.paymentOption);

    setShowAddPmModal(true);
  };

  const openEditPmModal = (pm: PaymentMethodConfig) => {
    const meta = getPaymentMethodDisplayMeta(pm);
    const resolvedSubs = getPaymentMethodSubOptions(pm);
    setEditingPmId(pm.id);
    setPmType(pm.type);
    setPmName(meta.displayTitle);
    setPmEnglishName(meta.englishName);
    setPmSubtitle(meta.displaySubtitle);
    setPmBadgeText(meta.badgeText);
    setPmAccountType(meta.accountType);
    setPmAccName(pm.accountName || 'MR. BOOKS');
    setPmAccNum(pm.accountNumber || '');
    setPmBankName(pm.bankName || '');
    setPmBranchName(pm.branchName || '');
    setPmRoutingNumber(pm.routingNumber || '');
    setPmRequireTrxId(meta.requireTrxId);
    setPmRequireSenderPhone(meta.requireSenderPhone);
    setPmInst(meta.instructionText);
    setPmLogoUrl(meta.customLogoUrl || '');
    setPmQrCodeUrl(meta.qrCodeUrl || '');
    setPmEnglishQrCodeUrl(meta.englishQrCodeUrl || meta.qrCodeUrl || '');
    setPmBengaliQrCodeUrl(meta.bengaliQrCodeUrl || '');
    setPmIsActive(pm.isActive);
    setPmSendMoneyOption(resolvedSubs.sendMoneyOption);
    setPmPaymentOption(resolvedSubs.paymentOption);
    setPmEditingSubTab(
      resolvedSubs.sendMoneyOption.enabled ? 'send_money' : 'payment'
    );
    setShowAddPmModal(true);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure at least one sub-option is enabled for non-COD methods
      const cleanSendMoney: PaymentSubOptionConfig = {
        ...pmSendMoneyOption,
        id: 'send_money',
        label: pmSendMoneyOption.label.trim() || 'সেন্ড মানি',
        englishLabel: (pmSendMoneyOption.englishLabel || 'Send Money').trim(),
        subtitle: (pmSendMoneyOption.subtitle || '').trim(),
        accountName: (pmSendMoneyOption.accountName || pmAccName || 'MR. BOOKS').trim(),
        accountNumber: (pmSendMoneyOption.accountNumber || pmAccNum).trim(),
        instructions: (pmSendMoneyOption.instructions || pmInst).trim(),
        qrCodeUrl: (pmSendMoneyOption.englishQrCodeUrl || pmSendMoneyOption.qrCodeUrl || '').trim(),
        englishQrCodeUrl: (pmSendMoneyOption.englishQrCodeUrl || pmSendMoneyOption.qrCodeUrl || '').trim(),
        bengaliQrCodeUrl: (pmSendMoneyOption.bengaliQrCodeUrl || '').trim(),
      };

      const cleanPayment: PaymentSubOptionConfig = {
        ...pmPaymentOption,
        id: 'payment',
        label: pmPaymentOption.label.trim() || 'পেমেন্ট',
        englishLabel: (pmPaymentOption.englishLabel || 'Make Payment').trim(),
        subtitle: (pmPaymentOption.subtitle || '').trim(),
        accountName: (pmPaymentOption.accountName || pmAccName || 'MR. BOOKS').trim(),
        accountNumber: (pmPaymentOption.accountNumber || cleanSendMoney.accountNumber || pmAccNum).trim(),
        instructions: (pmPaymentOption.instructions || getDefaultMerchantPaymentInstruction(pmType)).trim(),
        qrCodeUrl: (pmPaymentOption.englishQrCodeUrl || pmPaymentOption.qrCodeUrl || '').trim(),
        englishQrCodeUrl: (pmPaymentOption.englishQrCodeUrl || pmPaymentOption.qrCodeUrl || '').trim(),
        bengaliQrCodeUrl: (pmPaymentOption.bengaliQrCodeUrl || '').trim(),
      };

      if (pmType !== 'cod' && !cleanSendMoney.enabled && !cleanPayment.enabled) {
        cleanSendMoney.enabled = true;
      }

      // Sync primary enabled sub-option to top-level fields for backward compatibility
      const primarySub = cleanSendMoney.enabled ? cleanSendMoney : cleanPayment;
      const resolvedEnglishQr =
        primarySub.englishQrCodeUrl || pmEnglishQrCodeUrl.trim() || pmQrCodeUrl.trim();
      const resolvedBengaliQr =
        primarySub.bengaliQrCodeUrl || pmBengaliQrCodeUrl.trim();

      const payload: Partial<PaymentMethodConfig> = {
        name: pmName.trim() || 'পেমেন্ট মেথড',
        englishName: pmEnglishName.trim() || pmType.toUpperCase(),
        type: pmType,
        subtitle: pmSubtitle.trim(),
        badgeText: pmBadgeText.trim(),
        accountType: pmType === 'cod' ? 'None' : primarySub.accountType,
        accountName: pmType === 'cod' ? 'Cash on Delivery' : primarySub.accountName || 'MR. BOOKS',
        accountNumber: pmType === 'cod' ? 'N/A' : primarySub.accountNumber,
        bankName: pmType === 'bank' ? pmBankName.trim() : '',
        branchName: pmType === 'bank' ? pmBranchName.trim() : '',
        routingNumber: pmType === 'bank' ? pmRoutingNumber.trim() : '',
        requireTrxId: pmType === 'cod' ? false : pmRequireTrxId,
        requireSenderPhone: pmType === 'cod' ? false : pmRequireSenderPhone,
        instructions: pmType === 'cod' ? pmInst.trim() : primarySub.instructions,
        logoUrl: pmLogoUrl.trim() || '',
        qrCodeUrl: pmType === 'cod' ? '' : resolvedEnglishQr,
        englishQrCodeUrl: pmType === 'cod' ? '' : resolvedEnglishQr,
        bengaliQrCodeUrl: pmType === 'cod' ? '' : resolvedBengaliQr,
        ...(pmType !== 'cod'
          ? {
              sendMoneyOption: cleanSendMoney,
              paymentOption: cleanPayment,
            }
          : {}),
        isActive: pmIsActive,
      };

      if (editingPmId) {
        await updatePaymentMethod(editingPmId, payload);
        setToast({ show: true, type: 'success', message: 'Payment method (Send Money & Payment options) updated in Firestore!' });
      } else {
        const id = pmType + '-' + Date.now();
        await addPaymentMethod({
          ...(payload as PaymentMethodConfig),
          id,
          displayOrder: paymentMethods.length + 1,
        });
        setToast({ show: true, type: 'success', message: 'New payment method added and synced to Firestore!' });
      }
      setShowAddPmModal(false);
      setEditingPmId(null);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: err.message || 'Failed to save payment method' });
    }
  };

  const handleMovePaymentMethod = async (index: number, direction: 'up' | 'down') => {
    const sorted = sortPaymentMethods(paymentMethods);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await Promise.all(
        reordered.map((item, idx) =>
          updatePaymentMethod(item.id, {
            displayOrder: idx + 1,
            customOrder: true,
          })
        )
      );
      setToast({ show: true, type: 'success', message: 'Payment method order updated in real-time!' });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Failed to reorder payment methods' });
    }
  };

  const handleResetPaymentMethodsToDefaults = async () => {
    try {
      const defaultIds = new Set(DEFAULT_PAYMENT_METHODS.map(d => d.id));
      for (const existing of paymentMethods) {
        if (!defaultIds.has(existing.id)) {
          await deletePaymentMethod(existing.id);
        }
      }
      for (const def of DEFAULT_PAYMENT_METHODS) {
        await addPaymentMethod({ ...def, customOrder: false, badgeText: '' });
      }
      setToast({ show: true, type: 'success', message: 'Payment methods reset to clean defaults!' });
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Failed to reset payment methods' });
    }
  };

  const handlePmIconFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.85);
        if (isEditForId) {
          await updatePaymentMethod(isEditForId, { logoUrl: compressed });
          setToast({ show: true, type: 'success', message: 'Payment method icon updated successfully!' });
        } else {
          setPmLogoUrl(compressed);
          setToast({ show: true, type: 'success', message: 'Icon attached successfully!' });
        }
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to upload icon' });
      }
    }
  };

  const handlePmQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 700, 700, 0.88);
        if (isEditForId) {
          await updatePaymentMethod(isEditForId, { qrCodeUrl: compressed, englishQrCodeUrl: compressed });
          setToast({ show: true, type: 'success', message: 'English Payment QR Code uploaded & saved to Firestore!' });
        } else {
          setPmQrCodeUrl(compressed);
          setPmEnglishQrCodeUrl(compressed);
          setToast({ show: true, type: 'success', message: 'English Payment QR Code image attached!' });
        }
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to upload QR code image' });
      }
    }
  };

  const handlePmEnglishQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 700, 700, 0.88);
        if (isEditForId) {
          await updatePaymentMethod(isEditForId, { qrCodeUrl: compressed, englishQrCodeUrl: compressed });
          setToast({ show: true, type: 'success', message: 'English Payment QR Code uploaded & saved to Firestore!' });
        } else {
          setPmEnglishQrCodeUrl(compressed);
          setPmQrCodeUrl(compressed);
          setToast({ show: true, type: 'success', message: 'English Payment QR Code image attached!' });
        }
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to upload English QR code' });
      }
    }
  };

  const handlePmBengaliQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 700, 700, 0.88);
        if (isEditForId) {
          await updatePaymentMethod(isEditForId, { bengaliQrCodeUrl: compressed });
          setToast({ show: true, type: 'success', message: 'Bengali / Bangla QR Code uploaded & saved to Firestore!' });
        } else {
          setPmBengaliQrCodeUrl(compressed);
          setToast({ show: true, type: 'success', message: 'Bengali / Bangla QR Code image attached!' });
        }
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to upload Bengali QR code' });
      }
    }
  };

  const handleBookPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPdfUploading(true);
      const extracted = await extractPdfPreviewPages(file, 5, 850, 0.8);
      if (extracted.length > 0) {
        setProdPreviewPages(prev => {
          const combined = [...prev, ...extracted];
          return combined.map((p, idx) => ({
            ...p,
            pageNumber: idx + 1,
            title: p.title || `পৃষ্ঠা ${toBanglaDigits(idx + 1)}`,
          }));
        });
        setToast({
          show: true,
          type: 'success',
          message: `PDF থেকে ${extracted.length}টি পৃষ্ঠা সফলভাবে যুক্ত হয়েছে!`,
        });
      }
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: 'PDF প্রসেস করতে সমস্যা হয়েছে: ' + (err.message || 'অন্য ফাইল চেষ্টা করুন'),
      });
    } finally {
      setPdfUploading(false);
      e.target.value = '';
    }
  };

  const handleBookPagesImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setPdfUploading(true);
      const addedPages: BookPreviewPage[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i], 850, 1200, 0.82);
        addedPages.push({
          id: `img-page-${Date.now()}-${i}`,
          pageNumber: prodPreviewPages.length + i + 1,
          title: `পৃষ্ঠা ${toBanglaDigits(prodPreviewPages.length + i + 1)}`,
          imageUrl: compressed,
        });
      }
      setProdPreviewPages(prev =>
        [...prev, ...addedPages].map((p, idx) => ({
          ...p,
          pageNumber: idx + 1,
        }))
      );
      setToast({
        show: true,
        type: 'success',
        message: `${addedPages.length}টি বইয়ের পৃষ্ঠার ছবি যুক্ত হয়েছে!`,
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: err.message || 'পৃষ্ঠার ছবি আপলোড করা যায়নি',
      });
    } finally {
      setPdfUploading(false);
      e.target.value = '';
    }
  };

  const handleAddWrittenPreviewPage = () => {
    setProdPreviewPages(prev => {
      const nextNum = prev.length + 1;
      return [
        ...prev,
        {
          id: `text-page-${Date.now()}-${nextNum}`,
          pageNumber: nextNum,
          title: `পৃষ্ঠা ${toBanglaDigits(nextNum)}`,
          content: '',
        },
      ];
    });
  };

  const handleDuplicateProduct = async (p: Product) => {
    try {
      const copyRand = Math.floor(100 + Math.random() * 900);
      const newTitle = `${p.title} (Copy)`;
      const baseSlug = (p.slug || p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const newSlug = `${baseSlug}-copy-${copyRand}`;
      const newSku = p.sku ? `${p.sku}-CPY${copyRand}` : `SKU-${copyRand}`;

      const duplicatedVariants = (p.variants && p.variants.length > 0)
        ? p.variants.map((v: any, idx: number) => ({
            ...v,
            id: `v-${Date.now()}-${idx + 1}`,
            sku: v.sku ? `${v.sku}-CPY` : `${newSku}-V${idx + 1}`,
          }))
        : [{ id: `v1-${Date.now()}`, name: p.type === 'book' ? 'Paperback' : 'Standard', price: p.price, stock: 100, sku: newSku }];

      const payload = {
        type: p.type,
        title: newTitle,
        slug: newSlug,
        description: p.description || '',
        category: p.category,
        author: p.author || '',
        publisher: p.publisher || '',
        isbn: p.isbn || '',
        edition: p.edition || '1st Edition',
        pages: p.pages || 240,
        language: p.language || 'Bengali',
        brand: p.brand || '',
        material: p.material || '',
        dimensions: p.dimensions || '',
        colorModel: p.colorModel || '',
        images: p.images && p.images.length > 0 ? [...p.images] : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],
        price: p.price,
        previousPrice: p.previousPrice || p.price + 100,
        stock: p.stock || 100,
        sku: newSku,
        rating: 5.0,
        reviewCount: 0,
        isFeatured: Boolean(p.isFeatured),
        isOriginalBadge: p.isOriginalBadge !== false,
        isActive: p.isActive !== false,
        badge: p.badge || 'NEW',
        highlights: p.highlights && p.highlights.length > 0 ? [...p.highlights] : ['১০০% আসল মুদ্রিত বই', 'দ্রুততম ক্যাশ অন ডেলিভারি'],
        deliveryChargeType: p.deliveryChargeType || 'standard',
        customDeliveryFee: p.customDeliveryFee || 60,
        deliveryEstimate: p.deliveryEstimate || '২-৩ কার্যদিবস (2-3 Days)',
        deliveryTimingTitle: p.deliveryTimingTitle || 'ডেলিভারি টাইমিং (Delivery Timing)',
        insideDhakaDelivery: p.insideDhakaDelivery || '২৪-৪৮ ঘণ্টা (১-২ দিন)',
        outsideDhakaDelivery: p.outsideDhakaDelivery || '২-৩ কার্যদিবস (সারাদেশে)',
        deliveryTimingNote: p.deliveryTimingNote || 'আজকে অর্ডার করলে দ্রুততম সময়ে বাবল-র‍্যাপ প্যাকেজিংসহ কুরিয়ারে পাঠানো হবে।',
        deliveryTimerHours: p.deliveryTimerHours || 48,
        customBookDetails: p.customBookDetails ? [...p.customBookDetails] : [],
        previewHighlightTitle: p.previewHighlightTitle || 'বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)',
        previewHighlightSubtitle: p.previewHighlightSubtitle || '',
        previewIntro: p.previewIntro || '',
        previewPages: p.previewPages ? sanitizePreviewPages(p.previewPages) : [],
        variants: duplicatedVariants,
        createdAt: Date.now()
      };

      await addProduct(payload as any);
      setToast({
        show: true,
        type: 'success',
        message: `"${p.title}" সফলভাবে ডুপ্লিকেট (কপি) হয়েছে!`
      });
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: 'ডুপ্লিকেট করতে ব্যর্থ হয়েছে: ' + (err.message || 'Error')
      });
    }
  };

  const handleStartAddProduct = (type: 'book' | 'stationery') => {
    setEditingProductId(null);
    setProdType(type);
    setProdTitle('');
    setProdSlug('');
    setIsCustomSlug(false);
    setProdDescription('');
    setProdImage('');
    setProdExtraImages('');
    setProdGalleryUrls([]);
    setGalleryUrlInput('');
    setProdIsActive(true);
    setProdIsFeatured(false);
    setProdBadge('NEW');
    setProdDeliveryChargeType('standard');
    setProdCustomDeliveryFee(60);
    setProdDeliveryEstimate('২-৩ কার্যদিবস (2-3 Days)');
    setProdDeliveryTimingTitle('ডেলিভারি টাইমিং (Delivery Timing)');
    setProdInsideDhakaDelivery('২৪-৪৮ ঘণ্টা (১-২ দিন)');
    setProdOutsideDhakaDelivery('২-৩ কার্যদিবস (সারাদেশে)');
    setProdDeliveryTimingNote('আজকে অর্ডার করলে দ্রুততম সময়ে বাবল-র‍্যাপ প্যাকেজিংসহ কুরিয়ারে পাঠানো হবে।');
    setProdDeliveryTimerHours(48);
    setProdBookFormat('original');
    setProdPdfUrl('');
    setProdClassification('new');
    setProdSpecialOfferActive(false);
    setProdSpecialOfferTitle('মেগা ডিসকাউন্ট অফার');
    setProdSpecialOfferDiscount('');
    setProdIsFreeDelivery(false);
    setProdHomeDeliveryFee(60);
    setProdInsideDhakaFee(60);
    setProdOutsideDhakaFee(120);
    setProdSubAreaFee(90);
    setProdSundarbanDeliveryFee(120);
    setProdOtherCourierDeliveryFee(100);
    setProdWeightNote('Weight-based extra charge: ৳20 added per extra kg/item when weight increases.');
    setInFormReviews([]);
    setNewRevName('');
    setNewRevRating(5);
    setNewRevComment('');
    setNewRevVerified(true);
    setIsCustomAuthorInput(false);
    setIsCustomPublisherInput(false);

    if (type === 'book') {
      setProdPrice(350);
      setProdRegularPrice(450);
      const firstBookCat = categories.find(c => c.type === 'book')?.name || 'Fiction & Literature';
      setProdCategory(firstBookCat);
      const defaultAuth = authors[0]?.name || 'আরিফ আজাদ';
      setProdAuthor(defaultAuth);
      const defaultPub = publishers[0]?.name || 'গার্ডিয়ান প্রকাশনী';
      setProdPublisher(defaultPub);
      setProdIsbn('');
      setProdEdition('1st Edition');
      setProdPages(240);
      setProdLanguage('Bengali');
      const genSku = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      setProdSku(genSku);
      setProdCustomDetailsText('');
      setProdBrand('');
      setProdMaterial('');
      setProdDimensions('');
      setProdColorModel('');
      setProdIsOriginal(true);
      setProdPreviewHighlightTitle('বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)');
      setProdPreviewHighlightSubtitle('');
      setProdPreviewIntro('');
      setProdPreviewPages([]);
      setProdHighlights([]);
      setCustomVariants([
        { id: `v-${Date.now()}-1`, name: 'Paperback (পেপারব্যাক)', price: 350, regularPrice: 450, stock: 100, sku: `${genSku}-PB` },
        { id: `v-${Date.now()}-2`, name: 'Hardcover (হার্ডকভার)', price: 450, regularPrice: 550, stock: 50, sku: `${genSku}-HC` }
      ]);
      setProdPrintVariants('Paperback, Hardcover');
    } else {
      setProdPrice(220);
      setProdRegularPrice(290);
      const firstStatCat = categories.find(c => c.type === 'stationery')?.name || 'Notebooks & Diaries';
      setProdCategory(firstStatCat);
      setProdAuthor('');
      setProdPublisher('');
      setProdIsbn('');
      setProdEdition('');
      setProdPages(0);
      setProdLanguage('');
      const genSku = `ST-${Math.floor(1000 + Math.random() * 9000)}`;
      setProdSku(genSku);
      setProdCustomDetailsText('');
      setProdBrand('MR. BOOKS Essentials');
      setProdMaterial('Executive 80 GSM Paper & Leather Stitch');
      setProdDimensions('A5 (148 x 210 mm)');
      setProdColorModel('Matte Black');
      setProdIsOriginal(true);
      setProdPreviewHighlightTitle('');
      setProdPreviewHighlightSubtitle('');
      setProdPreviewIntro('');
      setProdPreviewPages([]);
      setProdHighlights([]);
      setCustomVariants([
        { id: `v-${Date.now()}-1`, name: 'Standard Pack (১টি)', price: 220, regularPrice: 290, stock: 100, sku: `${genSku}-STD` },
        { id: `v-${Date.now()}-2`, name: 'Combo Pack (২টি)', price: 400, regularPrice: 580, stock: 60, sku: `${genSku}-CMB` }
      ]);
      setProdPrintVariants('Standard Pack, Combo Pack');
    }

    setShowTypeChooserModal(false);
    setShowAddProdModal(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdTitle(p.title);
    setProdType(p.type);
    setProdSlug(p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    setIsCustomSlug(false);
    setProdPrice(p.price || 350);
    setProdRegularPrice(p.previousPrice || (p.price ? p.price + 100 : 450));
    setProdCategory(p.category);
    setProdAuthor(p.author || '');
    setProdPublisher(p.publisher || '');
    setProdIsbn(p.isbn || '');
    setProdEdition(p.edition || '3rd Edition');
    setProdPages(p.pages || 264);
    setProdLanguage(p.language || 'Bengali');
    setProdSku(p.sku || '');
    setProdCustomDetailsText(serializeCustomBookDetails(p.customBookDetails));
    setProdBrand(p.brand || p.author || '');
    setProdMaterial(p.material || '');
    setProdDimensions(p.dimensions || '');
    setProdColorModel(p.colorModel || '');
    setProdDescription(p.description || '');
    setProdIsActive(p.isActive !== false);
    setProdIsFeatured(Boolean(p.isFeatured));
    setProdBadge(p.badge || 'NEW');
    setProdHighlights(p.highlights || []);
    setProdDeliveryChargeType(p.deliveryChargeType || 'standard');
    setProdCustomDeliveryFee(p.customDeliveryFee || 60);
    setProdIsFreeDelivery(Boolean(p.isFreeDelivery || p.deliveryChargeType === 'free'));
    setProdHomeDeliveryFee(p.homeDeliveryFee ?? (p.customDeliveryFee || 60));
    setProdInsideDhakaFee(p.insideDhakaFee ?? p.homeDeliveryFee ?? 60);
    setProdOutsideDhakaFee(p.outsideDhakaFee ?? 120);
    setProdSubAreaFee(p.subAreaFee ?? 90);
    setProdSundarbanDeliveryFee(p.sundarbanDeliveryFee ?? 120);
    setProdOtherCourierDeliveryFee(p.otherCourierDeliveryFee ?? 100);
    setProdWeightNote(p.weightNote || 'Weight-based extra charge: ৳20 added per extra kg/item when weight increases.');
    setProdBookFormat(p.bookFormat || (p.isOriginalBadge !== false ? 'original' : 'copy'));
    setProdPdfUrl(p.pdfUrl || '');
    setProdClassification(p.isFeatured ? 'featured' : (p.badge === 'NEW' ? 'new' : 'regular'));
    setProdSpecialOfferActive(Boolean(p.specialOfferActive));
    setProdSpecialOfferTitle(p.specialOfferTitle || 'মেগা ডিসকাউন্ট অফার');
    setProdSpecialOfferDiscount(p.specialOfferDiscount || '');
    setIsCustomAuthorInput(p.author ? !authors.some(a => a.name.toLowerCase() === p.author?.toLowerCase()) : false);
    setIsCustomPublisherInput(p.publisher ? !publishers.some(pub => pub.name.toLowerCase() === p.publisher?.toLowerCase()) : false);
    setProdPreviewHighlightTitle(p.previewHighlightTitle || 'বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)');
    setProdPreviewHighlightSubtitle(p.previewHighlightSubtitle || '');
    setProdPreviewIntro(p.previewIntro || '');
    setProdPreviewPages(sanitizePreviewPages(p.previewPages));
    setProdImage(p.images?.[0] || '');
    setProdExtraImages(p.images?.slice(1).join(', ') || '');
    setProdGalleryUrls(p.images || []);
    setGalleryUrlInput('');
    setProdIsOriginal(p.isOriginalBadge !== false);
    setProdPrintVariants(p.variants ? p.variants.map((v: any) => v.name).join(', ') : 'Paperback, Hardcover');
    setProdDeliveryEstimate(p.deliveryEstimate || '২-৩ কার্যদিবস (2-3 Days)');
    setProdDeliveryTimingTitle(p.deliveryTimingTitle || 'ডেলিভারি টাইমিং (Delivery Timing)');
    setProdInsideDhakaDelivery(p.insideDhakaDelivery || '২৪-৪৮ ঘণ্টা (১-২ দিন)');
    setProdOutsideDhakaDelivery(p.outsideDhakaDelivery || '২-৩ কার্যদিবস (সারাদেশে)');
    setProdDeliveryTimingNote(p.deliveryTimingNote || 'আজকে অর্ডার করলে দ্রুততম সময়ে বাবল-র‍্যাপ প্যাকেজিংসহ কুরিয়ারে পাঠানো হবে।');
    setProdDeliveryTimerHours(p.deliveryTimerHours || 48);

    // Load customer reviews for this product
    const prodRevs = (reviews || []).filter(r => r && r.productId === p.id);
    setInFormReviews(prodRevs.map(r => ({
      id: r.id,
      userName: r.userName,
      rating: r.rating || 5,
      comment: r.comment || '',
      isVerifiedPurchase: r.isVerifiedPurchase !== false,
      createdAt: r.createdAt || Date.now()
    })));

    if (p.variants && p.variants.length > 0) {
      setCustomVariants(p.variants.map((v: any, idx: number) => ({
        id: v.id || `v-${idx + 1}`,
        name: v.name,
        price: v.price || p.price,
        regularPrice: v.previousPrice || (v.price ? v.price + 100 : undefined),
        stock: v.stock || 100,
        sku: v.sku || `${p.sku || 'SKU'}-V${idx + 1}`,
        description: v.description || ''
      })));
    } else {
      setCustomVariants([
        { id: 'v1', name: p.type === 'book' ? 'Paperback' : 'Standard Pack', price: p.price, regularPrice: p.previousPrice || p.price + 100, stock: 100, sku: p.sku || 'SKU-01', description: '' }
      ]);
    }
    setNewVariantDescription('');
    setShowAddProdModal(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImg = prodImage.trim() || prodGalleryUrls[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
    const extraList = prodExtraImages
      ? prodExtraImages.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 5)
      : [];
    const allImages = Array.from(new Set([primaryImg, ...prodGalleryUrls, ...extraList])).filter(Boolean);

    const resolvedSku =
      prodSku.trim() ||
      (prodType === 'book' ? 'MRB-BK-' : 'MRB-ST-') + Math.floor(1000 + Math.random() * 9000);

    const resolvedSlug =
      prodSlug.trim() ||
      prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
      `product-${Date.now().toString().slice(-6)}`;

    // Build variants
    let finalVariants = customVariants.filter(v => v.name.trim().length > 0);
    if (finalVariants.length === 0) {
      const parsedVariants = prodPrintVariants
        ? prodPrintVariants.split(',').map((vName, idx) => ({
            id: `v${idx + 1}`,
            name: vName.trim(),
            price: prodPrice,
            previousPrice: prodRegularPrice,
            stock: 100,
            sku: idx === 0 ? resolvedSku : `${resolvedSku}-V${idx + 1}`
          })).filter(v => v.name.length > 0)
        : [{ id: 'v1', name: prodType === 'book' ? 'Paperback' : 'Standard', price: prodPrice, previousPrice: prodRegularPrice, stock: 100, sku: resolvedSku }];
      finalVariants = parsedVariants;
    }

    const cleanedPreviewPages = sanitizePreviewPages(prodPreviewPages);
    const parsedCustomDetails = parseCustomBookDetails(prodCustomDetailsText);

    const resolvedBadge = prodClassification === 'featured'
      ? 'HOT'
      : (prodClassification === 'new' ? 'NEW' : (prodBadge || 'Original'));

    const calculatedRating = inFormReviews.length > 0
      ? Number((inFormReviews.reduce((sum, r) => sum + r.rating, 0) / inFormReviews.length).toFixed(1))
      : 5.0;

    const payload = {
      type: prodType,
      title: prodTitle,
      slug: resolvedSlug,
      description:
        prodDescription.trim() ||
        (prodType === 'book'
          ? 'Authentic book publication from MR. BOOKS.'
          : 'Premium stationery and office supply item.'),
      category: prodCategory,
      author: prodType === 'book' ? prodAuthor : (prodBrand || 'Stationery Brand'),
      publisher: prodType === 'book' ? (prodPublisher || 'MR. BOOKS Publications') : undefined,
      isbn: prodType === 'book' ? prodIsbn : undefined,
      edition: prodType === 'book' ? (prodEdition.trim() || 'Standard Edition') : undefined,
      pages: prodType === 'book' ? (Number(prodPages) > 0 ? Number(prodPages) : undefined) : undefined,
      language: prodType === 'book' ? (prodLanguage.trim() || 'Bengali') : undefined,
      brand: prodType === 'stationery' ? prodBrand : undefined,
      material: prodType === 'stationery' ? prodMaterial : undefined,
      dimensions: prodType === 'stationery' ? prodDimensions : undefined,
      colorModel: prodType === 'stationery' ? prodColorModel : undefined,
      images: allImages.length > 0 ? allImages : ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],
      price: Number(prodPrice) || 350,
      previousPrice: Number(prodRegularPrice) > Number(prodPrice) ? Number(prodRegularPrice) : Number(prodPrice) + 100,
      stock: 100,
      sku: resolvedSku,
      rating: calculatedRating,
      reviewCount: Math.max(1, inFormReviews.length),
      isFeatured: prodClassification === 'featured' || Boolean(prodIsFeatured),
      isOriginalBadge: prodBookFormat === 'original',
      bookFormat: prodBookFormat,
      pdfUrl: prodPdfUrl.trim() || undefined,
      isNewProduct: prodClassification === 'new',
      isActive: prodIsActive,
      badge: resolvedBadge,
      specialOfferActive: prodSpecialOfferActive,
      specialOfferTitle: prodSpecialOfferActive ? prodSpecialOfferTitle.trim() : undefined,
      specialOfferDiscount: prodSpecialOfferActive && Number(prodSpecialOfferDiscount) > 0 ? Number(prodSpecialOfferDiscount) : undefined,
      isFreeDelivery: prodIsFreeDelivery,
      deliveryChargeType: prodIsFreeDelivery ? 'free' : prodDeliveryChargeType,
      customDeliveryFee: prodIsFreeDelivery ? 0 : (prodDeliveryChargeType === 'custom' ? Number(prodCustomDeliveryFee) || 60 : 0),
      homeDeliveryFee: Number(prodHomeDeliveryFee) || 60,
      insideDhakaFee: Number(prodInsideDhakaFee) || 60,
      outsideDhakaFee: Number(prodOutsideDhakaFee) || 120,
      subAreaFee: Number(prodSubAreaFee) || 90,
      sundarbanDeliveryFee: Number(prodSundarbanDeliveryFee) || 120,
      otherCourierDeliveryFee: Number(prodOtherCourierDeliveryFee) || 100,
      weightNote: prodWeightNote.trim() || 'Weight-based extra charge: ৳20 added per extra kg/item when weight increases.',
      deliveryEstimate: prodDeliveryEstimate.trim() || '২-৩ কার্যদিবস (2-3 Days)',
      deliveryTimingTitle: prodDeliveryTimingTitle.trim() || 'ডেলিভারি টাইমিং (Delivery Timing)',
      insideDhakaDelivery: prodInsideDhakaDelivery.trim() || '২৪-৪৮ ঘণ্টা (১-২ দিন)',
      outsideDhakaDelivery: prodOutsideDhakaDelivery.trim() || '২-৩ কার্যদিবস (সারাদেশে)',
      deliveryTimingNote: prodDeliveryTimingNote.trim(),
      deliveryTimerHours: Number(prodDeliveryTimerHours) > 0 ? Number(prodDeliveryTimerHours) : 48,
      customBookDetails: parsedCustomDetails,
      previewHighlightTitle: prodPreviewHighlightTitle.trim() || 'বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)',
      previewHighlightSubtitle: prodPreviewHighlightSubtitle.trim(),
      previewIntro: prodPreviewIntro.trim(),
      previewPages: cleanedPreviewPages,
      variants: finalVariants.map((v, i) => ({
        id: v.id || `v${i+1}`,
        name: v.name,
        price: Number(v.price) || Number(prodPrice) || 350,
        previousPrice: v.regularPrice ? Number(v.regularPrice) : undefined,
        stock: Number(v.stock) || 100,
        sku: v.sku || `${resolvedSku}-V${i+1}`,
        ...(v.description && v.description.trim() ? { description: v.description.trim() } : {})
      }))
    };

    try {
      let savedProdId = editingProductId;
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        setToast({
          show: true,
          type: 'success',
          message: 'প্রোডাক্টের সমস্ত ডিটেইলস ও অপশন ফায়ারবেসে সফলভাবে আপডেট হয়েছে!',
        });
      } else {
        await addProduct(payload);
        savedProdId = resolvedSku || `prod-${Date.now()}`;
        setToast({
          show: true,
          type: 'success',
          message: 'নতুন প্রোডাক্ট ফায়ারবেস ডাটাবেসে সফলভাবে যুক্ত হয়েছে!',
        });
      }

      // Automatically sync and persist any newly added customer reviews for this product
      if (savedProdId && inFormReviews.length > 0) {
        for (const rev of inFormReviews) {
          if (!reviews.some(r => r.id === rev.id)) {
            await addProductReview({
              productId: savedProdId,
              userName: rev.userName,
              rating: rev.rating,
              comment: rev.comment,
              isVerifiedPurchase: rev.isVerifiedPurchase,
            });
          }
        }
      }

      // Sync publisher book count or auto-register new publisher when saving a book
      if (prodType === 'book' && prodPublisher.trim()) {
        const normalizedPub = prodPublisher.trim().toLowerCase();
        const matchedPub = publishers.find(
          p =>
            p.name.trim().toLowerCase() === normalizedPub ||
            (p.banglaName || '').trim().toLowerCase() === normalizedPub
        );
        if (!matchedPub) {
          await addPublisher({
            id: 'pub-' + Date.now(),
            name: prodPublisher.trim(),
            banglaName: prodPublisher.trim(),
            description: '',
            logoUrl: '',
            booksCount: 1,
            establishedYear: '',
            isFeatured: true,
          });
        }
      }

      setEditingProductId(null);
      setShowAddProdModal(false);
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: 'Firebase Error: ' + (err.message || 'Failed to save product'),
      });
    }
  };

  const handleBulkImportProducts = async (newProducts: Omit<Product, 'id' | 'createdAt'>[]) => {
    try {
      let successCount = 0;
      for (const prod of newProducts) {
        await addProduct(prod);
        successCount++;
      }
      setToast({
        show: true,
        type: 'success',
        message: `${successCount}টি প্রোডাক্ট ফায়ারবেস ডাটাবেসে সফলভাবে ইমপোর্ট করা হয়েছে!`
      });
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setToast({
        show: true,
        type: 'error',
        message: 'Bulk Import Error: ' + (err.message || 'Failed to import products')
      });
      throw err;
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setBannerUploading(true);
        const compressed = await compressImageFile(file, 1600, 900, 0.82);
        setBannerImage(compressed);
        setToast({ show: true, type: 'success', message: 'Banner image optimized for real-time Firestore sync!' });
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to process banner image' });
      } finally {
        setBannerUploading(false);
      }
    }
  };

  const handleAuthorFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.82);
        setAuthorPhoto(compressed);
        setToast({ show: true, type: 'success', message: 'Author photo optimized successfully!' });
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to process author photo' });
      }
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage) return;

    try {
      setBannerSaving(true);
      if (editingBannerId) {
        await updateBanner(editingBannerId, {
          title: bannerTitle,
          subtitle: bannerSubtitle,
          imageUrl: bannerImage,
          linkUrl: bannerLink,
          buttonText: bannerBtnText,
          showText: bannerShowText,
          showButton: bannerShowButton,
          buttonPosition: bannerBtnPos
        });
        setToast({ show: true, type: 'success', message: 'Hero banner updated and synced to Firebase in real-time!' });
      } else {
        await addBanner({
          id: 'banner-' + Date.now(),
          title: bannerTitle,
          subtitle: bannerSubtitle,
          imageUrl: bannerImage,
          linkUrl: bannerLink,
          buttonText: bannerBtnText,
          showText: bannerShowText,
          showButton: bannerShowButton,
          buttonPosition: bannerBtnPos,
          isActive: true,
          displayOrder: banners.length + 1
        });
        setToast({ show: true, type: 'success', message: 'New hero banner created and saved directly to Firebase in real-time!' });
      }

      setShowAddBannerModal(false);
      setEditingBannerId(null);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Firebase Error: ' + (err.message || 'Failed to save banner') });
    } finally {
      setBannerSaving(false);
    }
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName) return;

    try {
      if (editingAuthorId) {
        await updateAuthor(editingAuthorId, {
          name: authorName,
          bio: authorBio,
          photoUrl: authorPhoto,
          booksCount: authorBooksCount
        });
        setToast({ show: true, type: 'success', message: 'Author details updated and synced to Firebase in real-time!' });
      } else {
        await addAuthor({
          id: 'author-' + Date.now(),
          name: authorName,
          bio: authorBio,
          photoUrl: authorPhoto,
          booksCount: authorBooksCount
        });
        setToast({ show: true, type: 'success', message: 'Author created and saved to Firebase in real-time!' });
      }

      setShowAddAuthorModal(false);
      setEditingAuthorId(null);
      setAuthorName('');
      setAuthorBio('');
      setAuthorPhoto('');
      setAuthorBooksCount(20);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Firebase Error: ' + (err.message || 'Failed to save author') });
    }
  };

  const handlePublisherFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.82);
        setPubLogo(compressed);
        setToast({ show: true, type: 'success', message: 'Publisher logo optimized successfully!' });
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to process publisher logo' });
      }
    }
  };

  const handleSavePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubName.trim()) return;

    const autoCount = countBooksForPublisher(
      { name: pubName.trim(), banglaName: pubBanglaName.trim() || pubName.trim() },
      products
    );

    try {
      if (editingPublisherId) {
        await updatePublisher(editingPublisherId, {
          name: pubName.trim(),
          banglaName: pubBanglaName.trim() || pubName.trim(),
          description: pubDescription.trim(),
          logoUrl: pubLogo.trim(),
          booksCount: autoCount,
          establishedYear: pubEstYear.trim(),
          isFeatured: true,
        });
        setToast({ show: true, type: 'success', message: 'Publisher updated in Firebase!' });
      } else {
        await addPublisher({
          id: 'pub-' + Date.now(),
          name: pubName.trim(),
          banglaName: pubBanglaName.trim() || pubName.trim(),
          description: pubDescription.trim(),
          logoUrl: pubLogo.trim(),
          booksCount: autoCount,
          establishedYear: pubEstYear.trim(),
          isFeatured: true,
        });
        setToast({ show: true, type: 'success', message: 'New publisher added to Firebase!' });
      }

      setShowAddPublisherModal(false);
      setEditingPublisherId(null);
      setPubName('');
      setPubBanglaName('');
      setPubDescription('');
      setPubLogo('');
      setPubBooksCount(0);
      setPubEstYear('');
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Firebase Error: ' + (err.message || 'Failed to save publisher') });
    }
  };

  const handleCategoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 800, 800, 0.8);
        setCatImage(compressed);
        setToast({ show: true, type: 'success', message: 'Category photo optimized successfully!' });
      } catch (err: any) {
        setToast({ show: true, type: 'error', message: err.message || 'Failed to process category photo' });
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      if (editingCatId) {
        await updateCategory(editingCatId, {
          name: catName,
          type: catType,
          slug,
          image: catImage,
          showOnHome: catShowOnHome
        });
        setToast({ show: true, type: 'success', message: 'Category updated and synced to Firebase in real-time!' });
      } else {
        await addCategory({
          id: 'cat-' + Date.now(),
          name: catName,
          type: catType,
          slug,
          image: catImage,
          showOnHome: catShowOnHome
        });
        setToast({ show: true, type: 'success', message: 'Category created and saved directly to Firebase in real-time!' });
      }

      setShowAddCatModal(false);
      setEditingCatId(null);
      setCatName('');
      setCatImage('');
      setCatShowOnHome(true);
    } catch (err: any) {
      setToast({ show: true, type: 'error', message: 'Firebase Error: ' + (err.message || 'Failed to save category') });
    }
  };

  // 1. Loading State Check (Standalone Admin Portal Loader)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col items-center justify-center p-6 selection:bg-[#D71920] selection:text-white">
        <div className="text-center space-y-4 max-w-sm">
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-[#D71920]">
              <ShieldCheck size={24} />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wider uppercase">MR. BOOKS ADMIN PORTAL</h2>
            <p className="text-xs text-slate-400 mt-1">Authenticating with Firebase & validating administrator credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Barrier: Must sign in as Admin (100% Standalone Page, No Website Header/Footer)
  if (!currentUser) {
    const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setLoginLoading(true);
      try {
        await signIn(adminEmail, adminPassword);
      } catch (err: any) {
        setLoginError(err.message || 'Authentication failed. Please verify credentials.');
      } finally {
        setLoginLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center selection:bg-[#D71920] selection:text-white font-sans antialiased">
        {/* Center: Dedicated Standalone Admin Authentication Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
          <div className="w-full max-w-md bg-[#121826] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
            {/* Subtle top ambient crimson line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D71920] to-transparent"></div>

            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[#D71920] to-[#990F14] text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#D71920]/30">
                <Lock size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal Sign In</h1>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Restricted administrative console for <strong>MR. BOOKS</strong>. Please sign in with your administrator or staff credentials.
                </p>
              </div>
            </div>

            {loginError && (
              <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 text-red-200 rounded-2xl text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-300 mb-1.5 text-[11px] tracking-wider">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold uppercase text-slate-300 text-[11px] tracking-wider">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/90 text-white placeholder-slate-500 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#D71920] to-[#B9151B] hover:from-[#B9151B] hover:to-[#990F14] text-white font-black rounded-xl shadow-lg shadow-[#D71920]/25 transition-all text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loginLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Authenticating with Firebase...
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Sign In to Admin Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center text-xs">
              <button
                type="button"
                onClick={() => setActivePage('home')}
                className="text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
              >
                ← Back to Book Store
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Unauthorized Customer Barrier (100% Standalone Page)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-center selection:bg-[#D71920] selection:text-white font-sans antialiased">
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#121826] rounded-3xl max-w-md w-full p-8 shadow-2xl border border-red-900/40 text-center space-y-5">
            <div className="w-14 h-14 bg-red-950/80 text-[#FF4D4D] rounded-2xl flex items-center justify-center mx-auto border border-red-800/40">
              <XCircle size={30} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Access Denied</h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                You are currently signed in as <strong className="text-white">{currentUser.email}</strong>.
                <br />
                UID: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">{currentUser.uid}</code>
                <br /><br />
                This account does not have administrator privileges. Regular customer accounts are strictly forbidden from accessing the management console.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={async () => {
                  await logout();
                  setActivePage('admin');
                }}
                className="w-full py-3 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-[#D71920]/25 transition-all"
              >
                Sign Out & Login as Administrator
              </button>
              <button
                onClick={() => setActivePage('home')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs cursor-pointer border border-slate-800 transition-colors"
              >
                Return to Public Store
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
    count?: number;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  // Navigation Sections for the Left Sidebar Menu
  const navSections: NavSection[] = [
    {
      title: 'ANALYTICS & CORE',
      items: [
        { id: 'overview', label: 'Dashboard Analytics', icon: TrendingUp, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
      ]
    },
    {
      title: 'COMMERCE & ORDERS',
      items: [
        { id: 'orders', label: 'Customer Orders', icon: Package, count: orders.length },
        { id: 'special-offer', label: 'Special Offer Deals', icon: Flame },
        { 
          id: 'verifications', 
          label: 'Payment Verifications', 
          icon: CreditCard, 
          count: pendingVerificationsCount,
          badgeColor: pendingVerificationsCount > 0 ? 'bg-amber-500 text-black font-black animate-pulse' : undefined 
        },
        { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard, count: paymentMethods.length },
      ]
    },
    {
      title: 'CATALOG & STOREFRONT',
      items: [
        { id: 'products', label: 'Books & Inventory', icon: BookOpen, count: products.length },
        { id: 'categories', label: 'Categories', icon: Layers, count: categories.length },
        { id: 'banners', label: 'Hero Banners', icon: ImageIcon, count: banners.length },
        { id: 'authors', label: 'Writers & Authors', icon: Users, count: authors.length },
        { id: 'publishers', label: 'Publishers / প্রকাশনী', icon: Building2, count: publishers.length },
        { id: 'reels', label: 'Book Video Reels', icon: Film, count: reels.length },
        { id: 'reviews', label: 'Reviews & Reactions', icon: Star, count: reviews.length },
      ]
    },
    {
      title: 'MARKETING & AUDIENCE',
      items: [
        { id: 'coupons', label: 'Coupons & Promo Codes', icon: TicketPercent, count: coupons.length || 3 },
        {
          id: 'live-chat',
          label: 'Live Chat Inbox',
          icon: MessageCircle,
          count: liveChatSessions.reduce((sum, s) => sum + (s.unreadByAdmin || 0), 0) || liveChatSessions.length,
          badgeColor: liveChatSessions.some(s => (s.unreadByAdmin || 0) > 0) ? 'bg-[#D71920] text-white font-black animate-pulse' : undefined,
        },
        { id: 'capi', label: 'Conversion API & Pixel', icon: Server, badge: '9.8/10', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
        { id: 'subscribers', label: 'VIP Subscribers', icon: Mail, count: subscribers.length },
      ]
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { id: 'settings', label: 'Store Settings', icon: Settings },
        { id: 'staff', label: 'Staff & Roles Access', icon: Key, count: staffMembers.length, badge: 'Roles' },
        { id: 'profile', label: 'Admin Profile', icon: UserCheck, badge: 'Account' },
      ]
    }
  ];

  const renderSidebarNav = () => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D71920] to-[#B9151B] flex items-center justify-center text-white shadow-md shadow-[#D71920]/30 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-white">MR. BOOKS</span>
                <span className="text-[9px] font-black bg-[#D71920] text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                  ADMIN OS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live Sync</span>
              </div>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Sections Menu */}
        <div className="py-4 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-190px)]">
          {navSections.map((sec, sIdx) => {
            const visibleItems = sec.items.filter(item => canAccessTab(item.id));
            if (visibleItems.length === 0) return null;
            return (
              <div key={sIdx}>
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 px-3 mb-1.5">
                  {sec.title}
                </div>
                <div className="space-y-1">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setShowAddProdModal(false);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                          isActive
                            ? 'bg-[#D71920] text-white shadow-md shadow-[#D71920]/30 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/80 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon size={16} className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                            {item.badge}
                          </span>
                        ) : item.count !== undefined ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-black/30 text-white' 
                              : (item as any).badgeColor || 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                          }`}>
                            {item.count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer User Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070A11] space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div 
            onClick={() => setActiveTab('profile')}
            title="Click to view and edit Admin Profile"
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
          >
            <div className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 overflow-hidden ${
              staffRole === 'manager' 
                ? 'bg-purple-600 text-white' 
                : staffRole === 'employee' 
                ? 'bg-amber-600 text-white' 
                : 'bg-[#D71920] text-white'
            }`}>
              {!currentStaff && settings.adminProfile?.avatarUrl ? (
                <img src={settings.adminProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{currentStaff ? (currentStaff.name[0] || 'S').toUpperCase() : 'A'}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate group-hover:text-[#D71920] transition-colors">
                {currentStaff ? currentStaff.name : (settings.adminProfile?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Administrator'))}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  staffRole === 'manager' ? 'bg-purple-400' : staffRole === 'employee' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}></span>
                <span className="capitalize">{staffRole === 'owner' ? 'Super Admin' : staffRole || 'Admin'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              setActivePage('admin');
            }}
            title="Sign Out to Login Page"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors shrink-0 ml-1"
          >
            <LogOut size={15} />
          </button>
        </div>

        <button
          onClick={() => setActivePage('home')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <Eye size={14} className="text-slate-400" />
          <span>View Public Storefront</span>
          <ExternalLink size={12} className="text-slate-400" />
        </button>
      </div>
    </div>
  );

  // 4. Authenticated Administrator Control Console (100% Dedicated Standalone UI with Left Sidebar)
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#171717] flex font-sans antialiased selection:bg-[#D71920] selection:text-white">
      {/* Real-time Save Floating Toast Notification */}
      {toast?.show && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all border animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' 
            ? 'bg-slate-900 text-white border-emerald-500/50 shadow-emerald-950/20' 
            : 'bg-red-950 text-white border-red-500/50 shadow-red-950/20'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Off-Canvas Sidebar Overlay & Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0A0E17] text-slate-300 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {renderSidebarNav()}
          </aside>
        </div>
      )}

      {/* Desktop Pinned Left Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-[#0A0E17] text-slate-300 flex-col shrink-0 min-h-screen sticky top-0 h-screen border-r border-slate-800/90 select-none z-30">
        {renderSidebarNav()}
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F4F6F8] admin-workspace" data-admin-workspace="true">
        
        {/* Modern Top Header (Dark Frame matching Sidebar) */}
        <header className="bg-[#0A0E17] border-b border-slate-800 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-400 hidden sm:inline">Admin Console</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <span className="font-black text-white text-sm sm:text-base capitalize">
                {activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Facebook Pixel & CAPI Connection Status Indicator in Dashboard Header */}
            {(() => {
              const capiHeaderStatus = resolveDashboardHeaderCapiStatus(settings);
              return (
                <button
                  type="button"
                  data-testid="dashboard-header-capi-status"
                  onClick={() => setActiveTab('capi')}
                  title={`${capiHeaderStatus.subtitle} — Click to open Pixel & Conversion API Validator`}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all border ${
                    capiHeaderStatus.isConnected
                      ? 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-red-950/70 hover:bg-red-900/70 text-red-300 border-red-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      capiHeaderStatus.isConnected
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="hidden md:inline text-slate-300 font-bold">Pixel & CAPI:</span>
                  <span data-testid="dashboard-header-capi-label">
                    {capiHeaderStatus.label}
                  </span>
                  <span
                    className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-black ${
                      capiHeaderStatus.isConnected
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-red-500/20 text-red-200'
                    }`}
                  >
                    HTTP {capiHeaderStatus.responseCode}
                  </span>
                </button>
              );
            })()}

            {/* Storefront button */}
            <button
              onClick={() => setActivePage('home')}
              title="View Public Store"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye size={14} className="text-slate-400" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            {/* Admin Profile button */}
            <button
              onClick={() => setActiveTab('profile')}
              title="Admin Profile & Account Settings"
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#D71920] text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center shrink-0">
                {!currentStaff && settings.adminProfile?.avatarUrl ? (
                  <img src={settings.adminProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-white" />
                )}
              </div>
              <span className="hidden md:inline">Profile</span>
            </button>

            {/* Sign Out button */}
            <button
              onClick={async () => {
                await logout();
                setActivePage('admin');
              }}
              title="Logout Administrator to Login Page"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-red-950/60 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Area (Clean White Workspace) */}
        <main className="admin-workspace flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6" data-admin-workspace="true">

        {/* TAB 1: OVERVIEW & COMPREHENSIVE BUSINESS ANALYTICS */}
        {activeTab === 'overview' && (
          <AdminAnalytics 
            orders={orders} 
            products={products} 
            paymentSubmissions={paymentSubmissions} 
            onSelectTab={(tab) => setActiveTab(tab as any)} 
          />
        )}

        {/* TAB 2: MANUAL PAYMENT VERIFICATIONS & TRANSACTIONS */}
        {activeTab === 'verifications' && (() => {
          const filteredSubmissions = paymentSubmissions.filter(sub => {
            if (paymentMfsFilter !== 'all') {
              const p = (sub.providerName || '').toLowerCase();
              if (!p.includes(paymentMfsFilter.toLowerCase())) return false;
            }
            if (paymentStatusFilter === 'pending' && sub.status !== 'pending_verification') return false;
            if (paymentStatusFilter === 'paid' && sub.status !== 'approved') return false;
            if (paymentStatusFilter === 'failed' && sub.status !== 'rejected') return false;
            if (paymentSearchQuery.trim()) {
              const q = paymentSearchQuery.toLowerCase();
              const match =
                sub.orderId.toLowerCase().includes(q) ||
                sub.customerName.toLowerCase().includes(q) ||
                sub.customerPhone.toLowerCase().includes(q) ||
                sub.transactionReference.toLowerCase().includes(q) ||
                (sub.senderIdentifier || '').toLowerCase().includes(q);
              if (!match) return false;
            }
            return true;
          });

          return (
            <div className="space-y-4 sm:space-y-5">
              {/* Minimal Responsive Header + KPI Strip */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/15 shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        Payment Transactions
                      </h2>
                      <p className="text-xs text-slate-500">
                        Verify customer TrxID submissions & mobile banking payments
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw size={13} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Compact 2x2 (Phone) / 4-Col (Laptop & PC) Summary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block truncate">
                        Total Collected
                      </span>
                      <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                        ৳{paymentMetrics.totalCollected}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                        {paymentMetrics.completedCount} Verified
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
                      <DollarSign size={17} />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block truncate">
                        Today Collected
                      </span>
                      <div className="text-lg sm:text-xl font-black text-[#D71920] mt-0.5">
                        ৳{paymentMetrics.totalCollected}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                        Daily Total
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 flex items-center justify-center shrink-0">
                      <TrendingUp size={17} />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block truncate">
                        Pending Review
                      </span>
                      <div className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">
                        {paymentMetrics.pendingCount}
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600 block mt-0.5">
                        Awaiting Action
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
                      <Clock size={17} />
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500 tracking-wider block truncate">
                        MFS Breakdown
                      </span>
                      <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                        ৳{paymentMetrics.bkashTotal + paymentMetrics.nagadTotal}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 block mt-0.5 truncate">
                        bKash ৳{paymentMetrics.bkashTotal} · Nagad ৳{paymentMetrics.nagadTotal}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 border border-pink-200/70 flex items-center justify-center shrink-0">
                      <CreditCard size={17} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Streamlined Filter Bar + Submissions List */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by TrxID, sender mobile, customer or Order ID..."
                      value={paymentSearchQuery}
                      onChange={e => setPaymentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#D71920] transition-colors"
                    />
                  </div>

                  {/* Unified MFS Selector + Status Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={paymentMfsFilter}
                      onChange={e => setPaymentMfsFilter(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#D71920] cursor-pointer"
                    >
                      <option value="all">All Gateways</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                      <option value="rocket">Rocket</option>
                      <option value="upay">Upay</option>
                      <option value="bank">Bank / Card</option>
                    </select>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[
                        { id: 'all', label: `All (${paymentSubmissions.length})` },
                        { id: 'pending', label: `Pending (${paymentMetrics.pendingCount})` },
                        { id: 'paid', label: `Approved (${paymentMetrics.completedCount})` },
                        { id: 'failed', label: 'Rejected' },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPaymentStatusFilter(tab.id)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                            paymentStatusFilter === tab.id
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submissions Table (Laptop/PC) & Cards (Phone) */}
                {filteredSubmissions.length > 0 ? (
                  <>
                    {/* Desktop / Laptop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold tracking-wider">
                            <th className="py-3 px-3">Order ID</th>
                            <th className="py-3 px-3">Customer</th>
                            <th className="py-3 px-3">Gateway</th>
                            <th className="py-3 px-3">TrxID & Sender</th>
                            <th className="py-3 px-3">Amount</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSubmissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-[#D71920]">#{sub.orderId}</td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{sub.customerName}</div>
                                <div className="text-[11px] text-slate-500">{sub.customerPhone}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                                  {sub.providerName}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-slate-900">{sub.transactionReference}</div>
                                <div className="text-[11px] text-slate-500">Sender: {sub.senderIdentifier || 'N/A'}</div>
                              </td>
                              <td className="py-3 px-3 font-black text-slate-900 text-sm">৳{sub.claimedAmount}</td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    sub.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : sub.status === 'rejected'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {sub.status === 'pending_verification' ? 'Pending' : sub.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                {sub.status === 'pending_verification' ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => reviewPaymentSubmission(sub.id, 'approved')}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <CheckCircle2 size={13} /> Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRejectingSubId(sub.id)}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-[#D71920] font-bold rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <XCircle size={13} /> Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-medium text-slate-400">Verified</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Phone Card View */}
                    <div className="md:hidden space-y-2.5">
                      {filteredSubmissions.map(sub => (
                        <div key={sub.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-[#D71920]">#{sub.orderId}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : sub.status === 'rejected'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {sub.status === 'pending_verification' ? 'Pending' : sub.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{sub.customerName}</div>
                              <div className="text-[11px] text-slate-500">{sub.customerPhone}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-sm text-slate-900">৳{sub.claimedAmount}</div>
                              <div className="text-[11px] font-semibold text-slate-600">{sub.providerName}</div>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">TrxID: <strong className="font-mono text-slate-900">{sub.transactionReference}</strong></span>
                            <span className="text-slate-500">From: <strong className="font-mono text-slate-800">{sub.senderIdentifier || 'N/A'}</strong></span>
                          </div>
                          {sub.status === 'pending_verification' && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => reviewPaymentSubmission(sub.id, 'approved')}
                                className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingSubId(sub.id)}
                                className="py-2 bg-red-50 hover:bg-red-100 text-[#D71920] font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                      <CreditCard size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-500">
                      No payment submissions pending verification.
                    </p>
                  </div>
                )}

                {rejectingSubId && (
                  <div className="p-4 bg-red-50/70 rounded-xl border border-red-200 space-y-3 mt-3">
                    <h4 className="font-bold text-xs text-[#D71920]">
                      Reason for Payment Rejection
                    </h4>
                    <input
                      type="text"
                      placeholder="e.g. Transaction ID was not found in statement"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#D71920]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingSubId(null)}
                        className="px-3.5 py-1.5 bg-white text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          reviewPaymentSubmission(rejectingSubId, 'rejected', rejectReason);
                          setRejectingSubId(null);
                          setRejectReason('');
                        }}
                        className="px-4 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: PAYMENT METHODS CONFIGURATION */}
        {activeTab === 'payment-methods' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Minimal Header + Quick Templates Toolbar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/15 flex items-center justify-center shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Payment Methods
                    </h2>
                    <p className="text-xs text-slate-500">
                      Configure bKash, Nagad, Rocket, Upay, Bank Transfer & Cash on Delivery
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetPaymentMethodsToDefaults}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPmTemplateModal('custom')}
                    data-testid="add-payment-method-btn"
                    className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Plus size={14} />
                    <span>Add Method</span>
                  </button>
                </div>
              </div>

              {/* Quick Templates Strip (Scrollable on Mobile, Wrap on Laptop/PC) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Quick Add:
                </span>
                {[
                  { key: 'bkash', label: 'bKash', dotColor: 'bg-[#E2136E]' },
                  { key: 'nagad', label: 'Nagad', dotColor: 'bg-[#F7941D]' },
                  { key: 'rocket', label: 'Rocket', dotColor: 'bg-[#8C3494]' },
                  { key: 'upay', label: 'Upay', dotColor: 'bg-[#0054A6]' },
                  { key: 'cod', label: 'Cash on Delivery', dotColor: 'bg-[#00A651]' },
                  { key: 'bank', label: 'Bank Transfer', dotColor: 'bg-[#1E3A8A]' },
                ].map(tpl => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => openPmTemplateModal(tpl.key as any)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#FFF1F2] text-slate-700 hover:text-[#D71920] border border-slate-200 hover:border-[#D71920]/30 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full ${tpl.dotColor}`}></span>
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Grid of Payment Method Cards (1 col on Mobile/Laptop, 2 cols on Wide PC) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5" data-testid="admin-payment-methods-list">
              {sortPaymentMethods(paymentMethods).map((pm, idx, arr) => {
                const meta = getPaymentMethodDisplayMeta(pm);
                const subs = pm.type !== 'cod' ? getPaymentMethodSubOptions(pm) : null;

                return (
                  <div
                    key={pm.id}
                    data-testid={`admin-pm-row-${pm.type}`}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between gap-3.5 ${
                      pm.isActive
                        ? 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                        : 'border-slate-200/60 bg-slate-50/50 opacity-75'
                    }`}
                  >
                    {/* Top Row: Reorder + Icon + Title + Action Buttons */}
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePaymentMethod(idx, 'up')}
                            title="Move Up"
                            className="p-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMovePaymentMethod(idx, 'down')}
                            title="Move Down"
                            className="p-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </div>

                        <PaymentBrandIcon method={pm} size="md" />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-sm sm:text-base text-slate-900 truncate">
                              {meta.displayTitle}
                            </h3>
                            <span className="text-xs font-semibold text-slate-400">
                              ({meta.englishName})
                            </span>
                            {meta.badgeText && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                {meta.badgeText}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {meta.displaySubtitle}
                          </p>
                        </div>
                      </div>

                      {/* Right Actions: Active Toggle + Edit + Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await updatePaymentMethod(pm.id, { isActive: !pm.isActive });
                            setToast({
                              show: true,
                              type: 'success',
                              message: `${meta.displayTitle} ${!pm.isActive ? 'activated' : 'deactivated'}!`,
                            });
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-colors ${
                            pm.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pm.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{pm.isActive ? 'Active' : 'Off'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditPmModal(pm)}
                          data-testid={`edit-pm-${pm.type}`}
                          title="Edit Payment Method"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white cursor-pointer transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await deletePaymentMethod(pm.id);
                            setToast({
                              show: true,
                              type: 'success',
                              message: 'Payment method removed from Firestore.',
                            });
                          }}
                          title="Delete Payment Method"
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#D71920] cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Clean Minimal Numbers & Instructions Summary */}
                    {subs ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                        {subs.sendMoneyOption.enabled && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#E2136E]">
                                {subs.sendMoneyOption.label} ({subs.sendMoneyOption.accountType})
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {subs.sendMoneyOption.accountNumber || 'Not set'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {subs.sendMoneyOption.instructions}
                            </p>
                          </div>
                        )}
                        {subs.paymentOption.enabled && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                                {subs.paymentOption.label} ({subs.paymentOption.accountType})
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {subs.paymentOption.accountNumber || 'Not set'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {subs.paymentOption.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 truncate">
                        <strong className="text-slate-800">Instructions:</strong> {meta.instructionText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add / Edit Payment Method Modal */}
            {showAddPmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#E5E5E5] space-y-5 my-8 max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#EEEEEE]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 flex items-center justify-center">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-base text-[#171717]">
                          {editingPmId ? 'Edit Payment Method' : 'Configure Payment Method'}
                        </h3>
                        <p className="text-[11px] text-[#5F6368]">
                          Customize account number, subtitle, promo offer badge, icon, and popup instructions
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPmModal(false);
                        setEditingPmId(null);
                      }}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSavePaymentMethod} className="space-y-4 text-xs">
                    {/* Row 1: Gateway Type & Account Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Gateway Type *
                        </label>
                        <select
                          value={pmType}
                          onChange={e => {
                            const nextType = e.target.value as PaymentMethodConfig['type'];
                            setPmType(nextType);
                            if (nextType === 'cod') {
                              setPmAccountType('None');
                              setPmRequireTrxId(false);
                              setPmRequireSenderPhone(false);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] font-bold text-[#171717] focus:outline-none focus:border-[#D71920]"
                        >
                          <option value="bkash">bKash (বিকাশ)</option>
                          <option value="nagad">Nagad (নগদ)</option>
                          <option value="rocket">Rocket (রকেট)</option>
                          <option value="cod">Cash on Delivery (COD)</option>
                          <option value="upay">Upay (উপায়)</option>
                          <option value="bangla_qr">Bangla QR (বাংলা কিউআর)</option>
                          <option value="bank">Bank Transfer (ব্যাংক)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Subtitle (সাবটাইটেল - চেকআউট কার্ডে দেখাবে)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. বিকাশ সেন্ড মানি ও পেমেন্ট"
                          value={pmSubtitle}
                          onChange={e => setPmSubtitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#D71920]"
                        />
                      </div>
                    </div>

                    {/* Row 2: Display Name (Bangla) & English Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Display Title (বাংলা নাম) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. বিকাশ / ক্যাশ অন ডেলিভারি"
                          value={pmName}
                          onChange={e => setPmName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#D71920]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          English Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. bKash / Cash on Delivery"
                          value={pmEnglishName}
                          onChange={e => setPmEnglishName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#D71920]"
                        />
                      </div>
                    </div>

                    {/* Bank Specific Details (Only for Bank Transfer) */}
                    {pmType === 'bank' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/70">
                        <div>
                          <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                            Bank Name (ব্যাংকের নাম)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Eastern Bank PLC / DBBL"
                            value={pmBankName}
                            onChange={e => setPmBankName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#D71920]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                            Branch Name (ব্রাঞ্চ)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Gulshan Branch, Dhaka"
                            value={pmBranchName}
                            onChange={e => setPmBranchName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-[#171717] focus:outline-none focus:border-[#D71920]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                            Routing Number
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 095261234"
                            value={pmRoutingNumber}
                            onChange={e => setPmRoutingNumber(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white font-mono text-[#171717] focus:outline-none focus:border-[#D71920]"
                          />
                        </div>
                      </div>
                    )}

                    {/* DUAL PAYMENT CHANNELS CONFIGURATION (১. সেন্ড মানি & ২. পেমেন্ট) */}
                    {pmType !== 'cod' ? (() => {
                      const activeSub = pmEditingSubTab === 'send_money' ? pmSendMoneyOption : pmPaymentOption;
                      const updateActiveSub = (patch: Partial<PaymentSubOptionConfig>) => {
                        if (pmEditingSubTab === 'send_money') {
                          setPmSendMoneyOption(prev => ({ ...prev, ...patch }));
                        } else {
                          setPmPaymentOption(prev => ({ ...prev, ...patch }));
                        }
                      };

                      const handleSubQrFileUpload = async (
                        e: React.ChangeEvent<HTMLInputElement>,
                        qrLang: 'en' | 'bn'
                      ) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressImageFile(file, 700, 700, 0.88);
                          if (qrLang === 'en') {
                            updateActiveSub({
                              qrCodeUrl: compressed,
                              englishQrCodeUrl: compressed,
                            });
                            setToast({
                              show: true,
                              type: 'success',
                              message: `${activeSub.label} English QR Code attached!`,
                            });
                          } else {
                            updateActiveSub({
                              bengaliQrCodeUrl: compressed,
                            });
                            setToast({
                              show: true,
                              type: 'success',
                              message: `${activeSub.label} Bangla QR Code attached!`,
                            });
                          }
                        } catch (err: any) {
                          setToast({
                            show: true,
                            type: 'error',
                            message: err.message || 'Failed to upload QR code',
                          });
                        }
                      };

                      return (
                        <div className="rounded-2xl border-2 border-[#E2136E]/25 bg-gradient-to-b from-[#FFF5F9]/60 to-white p-4 space-y-4 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-pink-100">
                            <div>
                              <h4 className="font-black text-xs sm:text-sm text-[#171717] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#E2136E]" />
                                <span>দুইটি পেমেন্ট অপশন কনফিগারেশন (Send Money & Payment)</span>
                              </h4>
                              <p className="text-[10.5px] text-[#5F6368] mt-0.5">
                                প্রতিটি পেমেন্ট মেথডের ভেতরে <strong>সেন্ড মানি</strong> এবং <strong>পেমেন্ট</strong>—দুইটির জন্যই আলাদা নাম্বার, নাম, ইনস্ট্রাকশন ও কিউআর কোড সেট করুন।
                              </p>
                            </div>
                          </div>

                          {/* Switcher Tabs between Option 1 (সেন্ড মানি) and Option 2 (পেমেন্ট) */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setPmEditingSubTab('send_money')}
                              data-testid="admin-subtab-send_money"
                              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                                pmEditingSubTab === 'send_money'
                                  ? 'border-[#E2136E] bg-[#FFF0F6] shadow-2xs'
                                  : 'border-[#E5E5E5] bg-white hover:bg-[#F7F7F8]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-[#E2136E] text-white text-[9px] font-black uppercase">
                                    Option 1
                                  </span>
                                  <span className="font-black text-xs text-[#171717]">
                                    {pmSendMoneyOption.label || 'সেন্ড মানি'}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-[#5F6368] mt-1">
                                  {pmSendMoneyOption.accountNumber || 'নাম্বার যুক্ত করুন'} • {pmSendMoneyOption.accountType}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  pmSendMoneyOption.enabled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {pmSendMoneyOption.enabled ? ' চালু (ON)' : 'বন্ধ (OFF)'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPmEditingSubTab('payment')}
                              data-testid="admin-subtab-payment"
                              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                                pmEditingSubTab === 'payment'
                                  ? 'border-amber-600 bg-amber-50/80 shadow-2xs'
                                  : 'border-[#E5E5E5] bg-white hover:bg-[#F7F7F8]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-600 text-white text-[9px] font-black uppercase">
                                    Option 2
                                  </span>
                                  <span className="font-black text-xs text-[#171717]">
                                    {pmPaymentOption.label || 'পেমেন্ট'}
                                  </span>
                                </div>
                                <div className="text-[10px] font-mono text-[#5F6368] mt-1">
                                  {pmPaymentOption.accountNumber || 'নাম্বার যুক্ত করুন'} • {pmPaymentOption.accountType}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  pmPaymentOption.enabled
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {pmPaymentOption.enabled ? 'চালু (ON)' : 'বন্ধ (OFF)'}
                              </span>
                            </button>
                          </div>

                          {/* Active Sub-Option Editor Box */}
                          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 space-y-3.5">
                            {/* Header & Enable Toggle */}
                            <div className="flex items-center justify-between pb-2.5 border-b border-[#EEEEEE]">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${
                                    pmEditingSubTab === 'send_money' ? 'bg-[#E2136E]' : 'bg-amber-600'
                                  }`}
                                >
                                  {pmEditingSubTab === 'send_money' ? 'অপশন ১: সেন্ড মানি' : 'অপশন ২: পেমেন্ট'}
                                </span>
                                <span className="text-xs font-bold text-[#171717]">
                                  ({activeSub.label}) কনফিগারেশন
                                </span>
                              </div>

                              <label className="flex items-center gap-2 cursor-pointer bg-[#F7F7F8] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
                                <input
                                  type="checkbox"
                                  checked={activeSub.enabled}
                                  onChange={e => updateActiveSub({ enabled: e.target.checked })}
                                  className="w-4 h-4 accent-[#E2136E] rounded"
                                />
                                <span className="font-bold text-[11px] text-[#171717]">
                                  পপআপে এই অপশনটি চালু রাখুন
                                </span>
                              </label>
                            </div>

                            {/* Custom Option Name (Bangla), English Label & Account Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                                  অপশনের নাম (বাংলা) *
                                </label>
                                <input
                                  type="text"
                                  value={activeSub.label}
                                  onChange={e => updateActiveSub({ label: e.target.value })}
                                  placeholder={pmEditingSubTab === 'send_money' ? 'সেন্ড মানি' : 'পেমেন্ট'}
                                  data-testid={`subopt-label-${pmEditingSubTab}`}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#E2136E]"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                                  English Label
                                </label>
                                <input
                                  type="text"
                                  value={activeSub.englishLabel || ''}
                                  onChange={e => updateActiveSub({ englishLabel: e.target.value })}
                                  placeholder={pmEditingSubTab === 'send_money' ? 'Send Money' : 'Make Payment'}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#E2136E]"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                                  Account Type Badge
                                </label>
                                <select
                                  value={activeSub.accountType}
                                  onChange={e => updateActiveSub({ accountType: e.target.value as any })}
                                  className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] font-bold text-[#171717] focus:outline-none focus:border-[#E2136E]"
                                >
                                  <option value="Personal">Personal (পার্সোনাল)</option>
                                  <option value="Merchant">Merchant (মার্চেন্ট)</option>
                                  <option value="Agent">Agent (এজেন্ট)</option>
                                  <option value="None">None</option>
                                </select>
                              </div>
                            </div>

                            {/* Account Number & Account Holder Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                                  {activeSub.label} নাম্বার (Account / Wallet Number) *
                                </label>
                                <input
                                  type="text"
                                  value={activeSub.accountNumber}
                                  onChange={e => updateActiveSub({ accountNumber: e.target.value })}
                                  placeholder="017XXXXXXXX"
                                  data-testid={`subopt-number-${pmEditingSubTab}`}
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white font-mono font-bold text-sm text-[#171717] focus:outline-none focus:border-[#E2136E]"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                                  Account Holder Name (একাউন্টের নাম)
                                </label>
                                <input
                                  type="text"
                                  value={activeSub.accountName}
                                  onChange={e => updateActiveSub({ accountName: e.target.value })}
                                  placeholder="MR. BOOKS Official"
                                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#171717] focus:outline-none focus:border-[#E2136E]"
                                />
                              </div>
                            </div>

                            {/* Custom Instructions for this Sub-Option */}
                            <div>
                              <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                                {activeSub.label} ইনস্ট্রাকশন / নির্দেশনা (Popup Instructions) *
                              </label>
                              <textarea
                                rows={2}
                                value={activeSub.instructions}
                                onChange={e => updateActiveSub({ instructions: e.target.value })}
                                placeholder={
                                  pmEditingSubTab === 'send_money'
                                    ? 'বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত পার্সোনাল নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।'
                                    : 'বিকাশ অ্যাপের Payment অপশন থেকে অথবা *247# ডায়াল করে নির্ধারিত মার্চেন্ট নম্বরে Payment করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।'
                                }
                                data-testid={`subopt-instructions-${pmEditingSubTab}`}
                                className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-[#171717] focus:outline-none focus:border-[#E2136E]"
                              />
                            </div>

                            {/* Dual QR Codes (English QR & Bangla QR) for this specific Sub-Option */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {/* English QR for Sub-Option */}
                              <div className="p-3 rounded-xl bg-[#FFF0F6]/50 border border-[#FFADD2] space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[10px] uppercase text-[#171717] flex items-center gap-1">
                                    <QrCode size={12} className="text-[#E2136E]" />
                                    <span>{activeSub.label} — English QR</span>
                                  </span>
                                  {isValidImageUrl(activeSub.englishQrCodeUrl || activeSub.qrCodeUrl) && (
                                    <button
                                      type="button"
                                      onClick={() => updateActiveSub({ qrCodeUrl: '', englishQrCodeUrl: '' })}
                                      className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-11 h-11 rounded-lg bg-white border border-[#FFADD2] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                    {isValidImageUrl(activeSub.englishQrCodeUrl || activeSub.qrCodeUrl) ? (
                                      <img
                                        src={activeSub.englishQrCodeUrl || activeSub.qrCodeUrl}
                                        alt="Sub EN QR"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <span className="text-[8px] font-bold text-[#E2136E]">Auto QR</span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="QR Image URL"
                                    value={
                                      isValidImageUrl(activeSub.englishQrCodeUrl || activeSub.qrCodeUrl)
                                        ? activeSub.englishQrCodeUrl || activeSub.qrCodeUrl || ''
                                        : ''
                                    }
                                    onChange={e => {
                                      const v = sanitizeImageUrl(e.target.value);
                                      updateActiveSub({ qrCodeUrl: v, englishQrCodeUrl: v });
                                    }}
                                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[11px] text-[#171717]"
                                  />
                                  <label className="px-2.5 py-1.5 bg-[#E2136E] hover:bg-[#c81060] text-white font-bold rounded-lg text-[10px] cursor-pointer shrink-0 flex items-center gap-1">
                                    <Upload size={11} />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => {
                                        handleSubQrFileUpload(e, 'en');
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>

                              {/* Bangla QR for Sub-Option */}
                              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[10px] uppercase text-[#171717] flex items-center gap-1">
                                    <QrCode size={12} className="text-emerald-600" />
                                    <span>{activeSub.label} — বাংলা কিউআর</span>
                                  </span>
                                  {isValidImageUrl(activeSub.bengaliQrCodeUrl) && (
                                    <button
                                      type="button"
                                      onClick={() => updateActiveSub({ bengaliQrCodeUrl: '' })}
                                      className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-11 h-11 rounded-lg bg-white border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                    {isValidImageUrl(activeSub.bengaliQrCodeUrl) ? (
                                      <img
                                        src={activeSub.bengaliQrCodeUrl}
                                        alt="Sub BN QR"
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <span className="text-[8px] font-bold text-emerald-600">Auto BN</span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Bangla QR URL"
                                    value={
                                      isValidImageUrl(activeSub.bengaliQrCodeUrl)
                                        ? activeSub.bengaliQrCodeUrl || ''
                                        : ''
                                    }
                                    onChange={e => {
                                      const v = sanitizeImageUrl(e.target.value);
                                      updateActiveSub({ bengaliQrCodeUrl: v });
                                    }}
                                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white text-[11px] text-[#171717]"
                                  />
                                  <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer shrink-0 flex items-center gap-1">
                                    <Upload size={11} />
                                    <span>Upload</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => {
                                        handleSubQrFileUpload(e, 'bn');
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Cash on Delivery Instructions (পেমেন্ট নির্দেশনা) *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="বই হাতে পেয়ে ডেলিভারি ম্যানের কাছে নগদ অর্থ পরিশোধ করুন।"
                          value={pmInst}
                          onChange={e => setPmInst(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-[#171717] focus:outline-none focus:border-[#D71920]"
                        />
                      </div>
                    )}

                    {/* Row 4: Optional Promo Offer Badge (e.g. 5% OFF) */}
                    <div className="p-3.5 rounded-2xl bg-[#FFF1F2]/60 border border-[#D71920]/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-[#171717] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <span>🔥 Optional Offer Badge (অফার ব্যাজ - অপশনাল)</span>
                        </label>
                        {pmBadgeText && (
                          <button
                            type="button"
                            onClick={() => setPmBadgeText('')}
                            className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                          >
                            Remove Offer Badge
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Leave blank for no badge, or type e.g. 5% OFF / 10% Cashback"
                          value={pmBadgeText}
                          onChange={e => setPmBadgeText(e.target.value)}
                          data-testid="pm-badge-input"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white font-bold text-[#D71920] focus:outline-none focus:border-[#D71920]"
                        />
                        <button
                          type="button"
                          onClick={() => setPmBadgeText('5% OFF')}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF1F2] text-[#171717] border border-[#E5E5E5] text-[11px] font-bold cursor-pointer shrink-0"
                        >
                          + 5% OFF
                        </button>
                      </div>
                    </div>

                    {/* Row 5: Verification Checkboxes & Custom Brand Icon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pmType !== 'cod' && (
                        <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col justify-center space-y-2">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pmRequireTrxId}
                              onChange={e => setPmRequireTrxId(e.target.checked)}
                              className="w-4 h-4 accent-[#D71920] rounded"
                            />
                            <span className="font-bold text-[#171717]">Require Transaction ID (TrxID)</span>
                          </label>

                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pmRequireSenderPhone}
                              onChange={e => setPmRequireSenderPhone(e.target.checked)}
                              className="w-4 h-4 accent-[#D71920] rounded"
                            />
                            <span className="font-bold text-[#171717]">Require Sender Phone Number</span>
                          </label>
                        </div>
                      )}

                      <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px]">
                            Custom Icon / Logo (Optional)
                          </label>
                          {isValidImageUrl(pmLogoUrl) && (
                            <button
                              type="button"
                              onClick={() => setPmLogoUrl('')}
                              className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                            >
                              Reset Icon
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <PaymentBrandIcon
                            method={{
                              id: editingPmId || 'pm-preview',
                              name: pmName || 'Preview',
                              type: pmType,
                              accountName: pmAccName,
                              accountNumber: pmAccNum,
                              instructions: pmInst,
                              isActive: pmIsActive,
                              displayOrder: 1,
                              logoUrl: isValidImageUrl(pmLogoUrl) ? pmLogoUrl : '',
                            }}
                            size="sm"
                          />
                          <input
                            type="text"
                            placeholder="Icon URL"
                            value={isValidImageUrl(pmLogoUrl) ? pmLogoUrl : ''}
                            onChange={e => setPmLogoUrl(sanitizeImageUrl(e.target.value))}
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                          />
                          <label className="px-2.5 py-1.5 bg-[#FFF1F2] hover:bg-[#D71920] text-[#D71920] hover:text-white font-bold rounded-xl border border-[#D71920]/30 text-xs cursor-pointer transition-all shrink-0 flex items-center gap-1">
                            <Upload size={12} />
                            <span>Icon</span>
                            <input
                              type="file"
                              accept="image/*,.ico,.svg"
                              className="hidden"
                              onChange={e => {
                                handlePmIconFileUpload(e);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EEEEEE]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pmIsActive}
                          onChange={e => setPmIsActive(e.target.checked)}
                          className="w-4 h-4 accent-[#D71920] rounded"
                        />
                        <span className="font-bold text-[#171717]">Active on Checkout</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPmModal(false);
                            setEditingPmId(null);
                          }}
                          className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-bold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-md shadow-[#D71920]/20 cursor-pointer flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          <span>{editingPmId ? 'Save Changes' : 'Add Payment Method'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SPECIAL OFFER DEALS */}
        {activeTab === 'special-offer' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">Special Offer Deals</h2>
                  <p className="text-xs text-neutral-500">
                    Manage homepage special offer banner, discount rates, and stock progress
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={async () => {
                  try {
                    setSettingsSaving(true);
                    await updateSettings({ specialOffer: settingsForm.specialOffer });
                    setToast({ show: true, type: 'success', message: 'Special Offer configuration saved successfully!' });
                  } catch (err: any) {
                    setToast({ show: true, type: 'error', message: 'Failed to save: ' + err.message });
                  } finally {
                    setSettingsSaving(false);
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Check size={14} /> <span>{settingsSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Compact Enable & Heading Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 items-center">
                <label className="md:col-span-5 flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-200 cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-neutral-900 block">Show Special Offer on Homepage</span>
                    <span className="text-[11px] text-neutral-500">Toggle visibility on storefront</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.specialOffer?.enabled !== false}
                    onChange={e => {
                      const val = e.target.checked;
                      setSettingsForm(prev => ({
                        ...prev,
                        specialOffer: {
                          ...(prev.specialOffer || { title: 'Special Offer', endTime: Date.now() + 48*3600*1000, items: [] }),
                          enabled: val
                        }
                      }));
                    }}
                    className="w-4 h-4 accent-[#D71920] rounded cursor-pointer"
                  />
                </label>

                <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="font-bold text-neutral-600 text-xs shrink-0 sm:w-36">Section Heading:</label>
                  <input
                    type="text"
                    value={settingsForm.specialOffer?.title || 'Special Offer'}
                    onChange={e => {
                      const val = e.target.value;
                      setSettingsForm(prev => ({
                        ...prev,
                        specialOffer: {
                          ...(prev.specialOffer || { enabled: true, endTime: Date.now() + 48*3600*1000, items: [] }),
                          title: val
                        }
                      }));
                    }}
                    placeholder="e.g. Special Offer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              {/* Offer Products Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-wider">
                      Featured Deal Items
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold text-[11px]">
                      {settingsForm.specialOffer?.items?.length || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (products.length === 0) return;
                      const firstProd = products[0];
                      const currentItems = settingsForm.specialOffer?.items || [];
                      setSettingsForm(prev => ({
                        ...prev,
                        specialOffer: {
                          ...(prev.specialOffer || { enabled: true, title: 'Special Offer', endTime: Date.now() + 48*3600*1000 }),
                          items: [...currentItems, { productId: firstProd.id, discountPercentage: 20, soldPercentage: 50, onlinePaymentOnly: false }]
                        }
                      }));
                    }}
                    className="px-3.5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-neutral-800 transition-colors"
                  >
                    <Plus size={13} /> <span>Add Deal Product</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {(settingsForm.specialOffer?.items || []).map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all flex flex-col gap-3 shadow-2xs">
                        {/* Top row: Book thumbnail + selector + remove button */}
                        <div className="flex items-center gap-3">
                          <img
                            src={prod?.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}
                            alt=""
                            className="w-11 h-14 rounded-lg object-cover border border-neutral-200 shrink-0 bg-neutral-50"
                          />
                          <div className="flex-1 min-w-0">
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Select Product</label>
                            <select
                              value={item.productId}
                              onChange={e => {
                                const newId = e.target.value;
                                setSettingsForm(prev => {
                                  const items = [...(prev.specialOffer?.items || [])];
                                  items[idx] = { ...items[idx], productId: newId };
                                  return { ...prev, specialOffer: { ...prev.specialOffer!, items } };
                                });
                              }}
                              className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-900 focus:outline-none focus:bg-white focus:border-[#D71920]"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.title} (৳{p.price})</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSettingsForm(prev => {
                                const items = (prev.specialOffer?.items || []).filter((_, i) => i !== idx);
                                return { ...prev, specialOffer: { ...prev.specialOffer!, items } };
                              });
                            }}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors shrink-0 self-end mb-0.5"
                            title="Remove Deal"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Bottom row: Discount %, Sold %, and Online Only toggle */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-neutral-100 items-center">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Discount %</label>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={item.discountPercentage}
                              onChange={e => {
                                const val = Number(e.target.value) || 20;
                                setSettingsForm(prev => {
                                  const items = [...(prev.specialOffer?.items || [])];
                                  items[idx] = { ...items[idx], discountPercentage: val };
                                  return { ...prev, specialOffer: { ...prev.specialOffer!, items } };
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Sold Progress %</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={item.soldPercentage}
                              onChange={e => {
                                const val = Number(e.target.value) || 50;
                                setSettingsForm(prev => {
                                  const items = [...(prev.specialOffer?.items || [])];
                                  items[idx] = { ...items[idx], soldPercentage: val };
                                  return { ...prev, specialOffer: { ...prev.specialOffer!, items } };
                                });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                            />
                          </div>

                          <label className="col-span-2 sm:col-span-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200/80 text-xs font-bold text-neutral-700 cursor-pointer sm:mt-4">
                            <input
                              type="checkbox"
                              checked={!!item.onlinePaymentOnly}
                              onChange={e => {
                                const val = e.target.checked;
                                setSettingsForm(prev => {
                                  const items = [...(prev.specialOffer?.items || [])];
                                  items[idx] = { ...items[idx], onlinePaymentOnly: val };
                                  return { ...prev, specialOffer: { ...prev.specialOffer!, items } };
                                });
                              }}
                              className="w-3.5 h-3.5 accent-[#D71920] rounded"
                            />
                            <span className="truncate">Online Pay Only</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: BOOK VIDEO REELS */}
        {activeTab === 'reels' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <Film size={20} className="text-[#D71920]" />
                  <span>Book Video Reels Manager</span>
                </h2>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  Publish short video reviews, Facebook / Instagram Reels, YouTube Shorts, or MP4 video links displayed in a single row below Authors on the homepage.
                </p>
              </div>
              <button
                type="button"
                data-testid="add-new-reel-btn"
                onClick={() => {
                  setEditingReelId(null);
                  setReelTitle('');
                  setReelVideoUrl('');
                  setReelThumbnailUrl('');
                  setReelProductId('');
                  setReelProductSearchQuery('');
                  setThumbnailSourceNote('');
                  setShowAddReelModal(true);
                }}
                className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0 transition-transform active:scale-95"
              >
                <Plus size={14} /> Add New Video Reel
              </button>
            </div>

            {/* Reels Grid */}
            <div data-testid="admin-reels-manager" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reels.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-neutral-50 border border-dashed border-neutral-300 rounded-3xl space-y-3">
                  <div className="w-12 h-12 bg-red-50 text-[#D71920] rounded-2xl flex items-center justify-center mx-auto">
                    <Film size={22} />
                  </div>
                  <h3 className="font-bold text-sm text-neutral-800">এখনো কোনো ভিডিও রিল যুক্ত করা হয়নি</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    ইউটিউব শর্টস বা সরাসরি ভিডিও রিল আপলোড করতে উপরের "+ Add New Video Reel" বাটনে ক্লিক করুন।
                  </p>
                </div>
              ) : (
                reels.map(reel => {
                  const linkedProduct = reel.productId ? products.find(p => p.id === reel.productId) : null;
                  const ytId = extractYouTubeVideoId(reel.videoUrl);
                  const effectiveThumb = reel.thumbnailUrl || (ytId ? getYouTubeThumbnailUrl(ytId) : '');
                  const isDirect = isDirectVideoUrl(reel.videoUrl);

                  return (
                    <div 
                      key={reel.id} 
                      data-testid="admin-reel-card"
                      className="p-4 rounded-2xl border border-neutral-200 bg-[#F7F7F8] space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-2">
                        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200">
                          {effectiveThumb ? (
                            <img src={effectiveThumb} alt="" className="w-full h-full object-cover opacity-90" />
                          ) : isDirect ? (
                            <video src={reel.videoUrl} muted preload="metadata" className="w-full h-full object-cover opacity-90" />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-neutral-400 p-2 text-center">
                              <Film size={26} className="text-[#D71920] mb-1" />
                              <span className="text-[10px] font-bold text-white truncate max-w-full">{reel.title}</span>
                            </div>
                          )}

                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-md text-white flex items-center justify-center shadow">
                              <Play size={16} fill="currentColor" className="ml-0.5" />
                            </div>
                          </div>
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${reel.isActive !== false ? 'bg-emerald-500 text-white' : 'bg-zinc-600 text-white'}`}>
                            {reel.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <h3 className="font-bold text-xs text-neutral-900 line-clamp-2">{reel.title}</h3>
                        <p className="text-[10px] font-mono text-neutral-500 truncate" title={reel.videoUrl}>🎥 {reel.videoUrl}</p>

                        {linkedProduct && (
                          <div className="p-2 rounded-lg bg-white border border-neutral-200 flex items-center gap-2 text-[11px]">
                            <img src={linkedProduct.images[0]} alt="" className="w-7 h-7 rounded object-cover" />
                            <div className="truncate font-bold text-neutral-800">{linkedProduct.title} (৳{linkedProduct.price})</div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => updateReel(reel.id, { isActive: !reel.isActive })}
                          className="text-xs font-bold text-[#D71920] hover:underline cursor-pointer"
                        >
                          {reel.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          data-testid="admin-remove-reel-btn"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to permanently delete this reel?')) {
                              await deleteReel(reel.id);
                              setToast({ show: true, type: 'success', message: 'ভিডিও রিলটি স্থায়ীভাবে ডিলিট করা হয়েছে!' });
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add / Edit Reel Modal */}
            {showAddReelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D71920] flex items-center justify-center">
                        <Film size={16} />
                      </div>
                      <h3 className="font-black text-neutral-900 text-base">Add New Video Reel</h3>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddReelModal(false)} 
                      className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (isSubmittingReel) return;

                      if (!reelTitle.trim() || !reelVideoUrl.trim()) {
                        alert('দয়া করে রিলের টাইটেল এবং ভিডিও লিংক দিন');
                        return;
                      }

                      setIsSubmittingReel(true);
                      try {
                        // Calculate final thumbnail: user thumbnail > auto-extracted YouTube thumbnail > captured frame
                        let finalThumb = reelThumbnailUrl.trim();
                        if (!finalThumb) {
                          const ytId = extractYouTubeVideoId(reelVideoUrl);
                          if (ytId) {
                            finalThumb = getYouTubeThumbnailUrl(ytId);
                          } else if (isDirectVideoUrl(reelVideoUrl)) {
                            try {
                              finalThumb = await captureVideoFrame(reelVideoUrl, 0.5);
                            } catch {
                              finalThumb = '';
                            }
                          }
                        }

                        await addReel({
                          title: reelTitle.trim(),
                          videoUrl: reelVideoUrl.trim(),
                          thumbnailUrl: finalThumb, // NO unsplash fallback!
                          productId: reelProductId || undefined,
                          viewsCount: Math.floor(1200 + Math.random() * 2500),
                          likesCount: Math.floor(300 + Math.random() * 800),
                          isActive: true
                        });

                        setShowAddReelModal(false);
                        setToast({ show: true, type: 'success', message: 'ভিডিও রিল সফলভাবে পাবলিশ করা হয়েছে!' });
                      } catch (err: any) {
                        alert('Error saving reel: ' + (err?.message || 'Failed'));
                      } finally {
                        setIsSubmittingReel(false);
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    {/* Reel Title */}
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">
                        রিলসের শিরোনাম / ক্যাপশন (Reel Title) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        data-testid="reel-title-input"
                        placeholder="যেমন: প্যারাডক্সিক্যাল সাজিদ ২ বুক রিভিউ"
                        value={reelTitle}
                        onChange={e => setReelTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                      />
                    </div>

                    {/* Video Link / URL with Auto-Thumbnail on input */}
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1 flex items-center justify-between">
                        <span>ভিডিও লিংক / URL (YouTube Shorts / MP4 / WebM) <span className="text-red-500">*</span></span>
                        {isExtractingThumbnail && (
                          <span className="text-[10px] text-[#D71920] font-bold flex items-center gap-1 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-[#D71920] animate-ping" />
                            থাম্বনেইল সংগ্রহ হচ্ছে...
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        required
                        data-testid="reel-video-url-input"
                        placeholder="https://youtube.com/shorts/... অথবা https://.../video.mp4"
                        value={reelVideoUrl}
                        onChange={async (e) => {
                          const val = e.target.value;
                          setReelVideoUrl(val);
                          const clean = val.trim();
                          if (!clean) return;

                          // Auto-extract YouTube Shorts / YouTube thumbnail
                          const ytId = extractYouTubeVideoId(clean);
                          if (ytId) {
                            const ytThumb = getYouTubeThumbnailUrl(ytId);
                            setReelThumbnailUrl(ytThumb);
                            setThumbnailSourceNote('YouTube ভিডিও থেকে স্বয়ংক্রিয়ভাবে থাম্বনেইল নেওয়া হয়েছে');
                            return;
                          }

                          // Auto-extract frame from direct MP4 / WebM
                          if (isDirectVideoUrl(clean)) {
                            try {
                              setIsExtractingThumbnail(true);
                              const frame = await captureVideoFrame(clean, 0.5);
                              setReelThumbnailUrl(frame);
                              setThumbnailSourceNote('ভিডিও থেকে স্বয়ংক্রিয়ভাবে থাম্বনেইল ফ্রেম তৈরি হয়েছে');
                            } catch (err) {
                              console.warn('Frame extraction notice:', err);
                              setThumbnailSourceNote('ভিডিও থেকে সরাসরি ফ্রেম প্লে হবে');
                            } finally {
                              setIsExtractingThumbnail(false);
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white font-mono text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        ইউটিউব শর্টস (YouTube Shorts) বা সরাসরি MP4 ভিডিও লিংক পেস্ট করুন।
                      </p>
                    </div>

                    {/* Auto-Captured Video Thumbnail Section & Custom Upload */}
                    <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-neutral-800 text-xs flex items-center gap-1.5">
                          <Eye size={13} className="text-[#D71920]" />
                          <span>ভিডিও থাম্বনেইল (Auto Video Thumbnail)</span>
                        </label>
                        {reelThumbnailUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setReelThumbnailUrl('');
                              setThumbnailSourceNote('');
                            }}
                            className="text-[10px] text-red-600 hover:underline cursor-pointer"
                          >
                            থাম্বনেইল মুছুন
                          </button>
                        )}
                      </div>

                      {reelThumbnailUrl ? (
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-neutral-200">
                          <img
                            src={reelThumbnailUrl}
                            alt="Cover Thumbnail"
                            className="w-14 h-18 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                              ✓ ভিডিও থেকে স্বয়ংক্রিয় থাম্বনেইল সংগৃহীত
                            </span>
                            <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                              {thumbnailSourceNote || 'ভিডিওর প্রথম ফ্রেম কভার হিসেবে সেট করা হয়েছে'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-neutral-500 leading-relaxed">
                          ভিডিও লিংক দিলে এই ভিডিও থেকেই অটোমেটিক্যালি থাম্বনেইল নিয়ে নিবে। আলাদা কোনো থাম্বনেইল না দিলে কোনো ডামি ছবি আসবে না।
                        </div>
                      )}

                      {/* Optional Custom Cover Upload */}
                      <div className="pt-2 border-t border-neutral-200/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-neutral-600">চাইলে কাস্টম কভার ছবিও আপলোড করতে পারেন:</span>
                        <label className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-[#D71920] rounded-xl text-[11px] font-bold text-neutral-700 hover:text-[#D71920] cursor-pointer transition-colors shrink-0 shadow-2xs">
                          <span>ছবি বাছুন</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressImageFile(file, 720, 1280, 0.82);
                                  setReelThumbnailUrl(compressed);
                                  setThumbnailSourceNote('কাস্টম কভার ছবি আপলোড করা হয়েছে');
                                } catch (err: any) {
                                  alert('Image error: ' + err.message);
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Searchable Product Picker */}
                    <div className="space-y-1.5">
                      <label className="block font-bold text-neutral-700 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShoppingCart size={13} className="text-[#D71920]" />
                          <span>রিলসের সাথে যুক্ত বই / প্রোডাক্ট (Linked Product for Buy Button)</span>
                        </span>
                        {reelProductId && (
                          <button
                            type="button"
                            onClick={() => {
                              setReelProductId('');
                              setReelProductSearchQuery('');
                            }}
                            className="text-[11px] text-red-600 hover:underline cursor-pointer"
                          >
                            রিমুভ করুন
                          </button>
                        )}
                      </label>

                      {(() => {
                        const linked = reelProductId ? products.find(p => p.id === reelProductId) : null;
                        const filtered = searchProductsForReel(products, reelProductSearchQuery);

                        if (linked) {
                          return (
                            <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={linked.images[0]}
                                  alt=""
                                  className="w-10 h-10 rounded-xl object-cover border border-red-200 bg-white shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-neutral-900 truncate">{linked.title}</div>
                                  <div className="text-[11px] text-neutral-500 truncate">
                                    {linked.author || linked.category} • <strong className="text-[#D71920]">৳{linked.price}</strong>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setReelProductId('');
                                  setReelProductSearchQuery('');
                                }}
                                className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shrink-0"
                                title="বই পরিবর্তন বা রিমুভ করুন"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            <div className="relative">
                              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                              <input
                                type="text"
                                data-testid="reel-product-search-input"
                                value={reelProductSearchQuery}
                                onChange={e => setReelProductSearchQuery(e.target.value)}
                                placeholder="বইয়ের নাম বা লেখক লিখে সার্চ করুন..."
                                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:ring-1 focus:ring-[#D71920]"
                              />
                            </div>

                            <div className="max-h-36 overflow-y-auto border border-neutral-200 rounded-xl bg-white divide-y divide-neutral-100 shadow-inner">
                              <button
                                type="button"
                                onClick={() => {
                                  setReelProductId('');
                                  setReelProductSearchQuery('');
                                }}
                                className="w-full p-2 text-left text-xs font-semibold text-neutral-600 hover:bg-neutral-50 flex items-center justify-between cursor-pointer"
                              >
                                <span>কোনো নির্দিষ্ট বই নেই (সাধারণ বুক রিভিউ / শর্টস)</span>
                                <span className="text-[10px] text-neutral-400">General Reel</span>
                              </button>

                              {filtered.length === 0 ? (
                                <div className="p-3 text-center text-xs text-neutral-400">
                                  "{reelProductSearchQuery}" দিয়ে কোনো বই পাওয়া যায়নি।
                                </div>
                              ) : (
                                filtered.map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    data-testid={`select-reel-prod-${p.id}`}
                                    onClick={() => {
                                      setReelProductId(p.id);
                                      setReelProductSearchQuery('');
                                    }}
                                    className="w-full p-2 text-left flex items-center justify-between gap-2.5 hover:bg-red-50/50 transition-colors cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img
                                        src={p.images[0]}
                                        alt=""
                                        className="w-8 h-8 rounded-lg object-cover border border-neutral-200 bg-neutral-50 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-neutral-900 group-hover:text-[#D71920] truncate">
                                          {p.title}
                                        </div>
                                        <div className="text-[10px] text-neutral-500 truncate">
                                          {p.author || p.category}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-xs font-black text-[#D71920] shrink-0">৳{p.price}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                      <button 
                        type="button" 
                        onClick={() => setShowAddReelModal(false)} 
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 font-bold rounded-xl text-neutral-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmittingReel}
                        data-testid="submit-reel-btn"
                        className="px-5 py-2 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        {isSubmittingReel ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Publishing...</span>
                          </>
                        ) : (
                          <span>Publish Reel</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CUSTOMER REVIEWS & REACTIONS MANAGER */}
        {activeTab === 'reviews' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <Star size={20} className="text-amber-500 fill-amber-500" />
                  <span>Customer Reviews & Real-Time Reactions Manager</span>
                </h2>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  Manage verified product reviews and real-time customer reaction counts (Like, Love, Dislike) synced with Firebase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminRevProdId(products[0]?.id || '');
                  setAdminRevUserName('');
                  setAdminRevRating(5);
                  setAdminRevComment('');
                  setShowAddAdminRevModal(true);
                }}
                className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add Verified Review
              </button>
            </div>

            {/* HOMEPAGE REVIEW VISIBILITY, REPLACEMENT FEATURE & GREEN ICON (💚) SYSTEM */}
            <div
              data-testid="admin-home-review-system-panel"
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 border border-emerald-200/90 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    {renderGreenReviewIcon(settings.homeReviewIconStyle, 18)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-neutral-900">
                        Homepage Review System, Slot Replacement & Green Icon (💚) Customizer
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          settings.showHomeReviewsSection !== false &&
                          settings.homeReviewsSlotReplacement !== 'off'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {settings.showHomeReviewsSection === false ||
                        settings.homeReviewsSlotReplacement === 'off'
                          ? 'Homepage Review: OFF'
                          : settings.homeReviewsSlotReplacement &&
                              settings.homeReviewsSlotReplacement !== 'reviews'
                            ? `Replaced with: ${settings.homeReviewsSlotReplacement.replace('_', ' ')}`
                            : 'Homepage Review: SHOW (Active)'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Turn Homepage Reviews ON or OFF anytime, replace that Homepage space with another high-converting store feature, or customize the Green Review Icon (💚) without using a star.
                    </p>
                  </div>
                </div>

                {/* Quick Show / Off Master Switch */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="toggle-home-reviews-show-btn"
                    onClick={async () => {
                      const nextSlot =
                        homeConfig.reviewsSlotReplacement === 'off'
                          ? 'reviews'
                          : homeConfig.reviewsSlotReplacement || 'reviews';
                      await updateHomeConfig({
                        showReviews: true,
                        reviewsSlotReplacement: nextSlot,
                      });
                      setToast({ show: true, type: 'success', message: 'Homepage Reviews enabled in homeConfig!' });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all flex items-center gap-1.5 ${
                      homeConfig.showReviews !== false &&
                      homeConfig.reviewsSlotReplacement !== 'off'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Show on Home</span>
                  </button>
                  <button
                    type="button"
                    data-testid="toggle-home-reviews-off-btn"
                    onClick={async () => {
                      await updateHomeConfig({
                        showReviews: false,
                        reviewsSlotReplacement: 'off',
                      });
                      setToast({ show: true, type: 'success', message: 'Homepage Reviews turned OFF in homeConfig!' });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all flex items-center gap-1.5 ${
                      homeConfig.showReviews === false ||
                      homeConfig.reviewsSlotReplacement === 'off'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <EyeOff size={13} />
                    <span>Turn Off</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Homepage Section Slot Selector (Reviews vs Alternative Feature vs Off) */}
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/80 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-emerald-950">
                    1. Homepage Review Section Slot (What to Show)
                  </label>
                  <select
                    data-testid="home-reviews-slot-select"
                    value={
                      settings.showHomeReviewsSection === false &&
                      (!settings.homeReviewsSlotReplacement ||
                        settings.homeReviewsSlotReplacement === 'reviews')
                        ? 'off'
                        : settings.homeReviewsSlotReplacement || 'reviews'
                    }
                    onChange={async e => {
                      const val = e.target.value as
                        | 'reviews'
                        | 'trust_features'
                        | 'publishers_spotlight'
                        | 'reading_benefits'
                        | 'off';
                      await updateSettings({
                        showHomeReviewsSection: val !== 'off',
                        homeReviewsSlotReplacement: val,
                      });
                      setToast({
                        show: true,
                        type: 'success',
                        message:
                          val === 'off'
                            ? 'Homepage review slot hidden (Off)'
                            : `Homepage slot updated to: ${val.replace('_', ' ')}`,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-[#F8FAFC] text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="reviews">
                      💚 Show Customer Reviews Carousel (Default)
                    </option>
                    <option value="trust_features">
                      🛡️ Replace with: Store Trust & Fast Delivery Guarantees
                    </option>
                    <option value="publishers_spotlight">
                      🏛️ Replace with: Official Publications & Partner Houses
                    </option>
                    <option value="reading_benefits">
                      📖 Replace with: Look Inside Book Preview & Reader Perks Banner
                    </option>
                    <option value="off">🚫 Turn Off (Keep Homepage Slot Empty)</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Choose whether to display Customer Reviews on the Homepage, replace that space with another store feature, or keep it turned off.
                  </p>
                </div>

                {/* 2. Product Card Small Review Badge Mode */}
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/80 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-emerald-950">
                    2. Product Card Review Slot (On Book Cards)
                  </label>
                  <select
                    data-testid="product-card-review-slot-select"
                    value={settings.productCardReviewSlotMode || 'green_rating'}
                    onChange={async e => {
                      const val = e.target.value as
                        | 'green_rating'
                        | 'publisher_tag'
                        | 'verified_badge'
                        | 'stock_status'
                        | 'off';
                      await updateSettings({ productCardReviewSlotMode: val });
                      setToast({ show: true, type: 'success', message: 'Product card review slot updated!' });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-[#F8FAFC] text-xs font-bold text-neutral-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="green_rating">
                      💚 Green Review Score Badge (e.g. 💚 4.9 (12))
                    </option>
                    <option value="publisher_tag">
                      🏛️ Replace with: Publisher Name Badge
                    </option>
                    <option value="verified_badge">
                      🛡️ Replace with: "Verified Print" Green Badge
                    </option>
                    <option value="stock_status">
                      ✅ Replace with: Live Stock Count Badge
                    </option>
                    <option value="off">🚫 Turn Off on Product Cards</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Customize or replace the small rating badge shown on Homepage & Storefront book cards.
                  </p>
                </div>

                {/* 3. Green Review Icon Style Selector (Non-Star Curated Options) */}
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/80 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-emerald-950">
                    3. Green Review Icon Style (💚 Instead of Star)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'heart', label: '💚 Green Heart' },
                      { id: 'verified_shield', label: '🛡️ Trust Shield' },
                      { id: 'thumbs_up', label: '👍 Thumbs Up' },
                      { id: 'check_badge', label: '✅ Check Badge' },
                      { id: 'sparkles', label: '✨ Sparkles' },
                      { id: 'book_love', label: '📖 Book Icon' },
                    ].map(opt => {
                      const activeIcon = (settings.homeReviewIconStyle || 'heart') === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          data-testid={`review-icon-option-${opt.id}`}
                          onClick={async () => {
                            await updateSettings({
                              homeReviewIconStyle: opt.id as any,
                            });
                            setToast({
                              show: true,
                              type: 'success',
                              message: `Green review icon changed to ${opt.label}!`,
                            });
                          }}
                          className={`px-2.5 py-2 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                            activeIcon
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                              : 'bg-[#F8FAFC] text-neutral-700 border-neutral-200 hover:border-emerald-300'
                          }`}
                        >
                          <span
                            className={`inline-flex ${
                              activeIcon ? '[&_svg]:!text-white' : ''
                            }`}
                          >
                            {renderGreenReviewIcon(opt.id, 13)}
                          </span>
                          <span className="truncate">{opt.label.replace(/^[^\s]+\s/, '')}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-800 font-bold">
                    <span>Live Green Preview:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="inline-flex">
                          {renderGreenReviewIcon(settings.homeReviewIconStyle, 13)}
                        </span>
                      ))}
                      <span className="ml-1 text-emerald-800 font-black">5.0</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Co-Control for Homepage Writer / Author On/Off & Slot Replacement */}
              <div className="pt-3 border-t border-emerald-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 flex items-center justify-center shrink-0">
                    <UserCheck size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-neutral-900">
                        Homepage Writer / Author Slot Control (Both Review & Writer Systems)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          settings.showHomeWritersSection !== false &&
                          settings.homeWritersSlotReplacement !== 'off'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {settings.showHomeWritersSection === false ||
                        settings.homeWritersSlotReplacement === 'off'
                          ? 'Writers on Home: OFF'
                          : settings.homeWritersSlotReplacement &&
                              settings.homeWritersSlotReplacement !== 'writers'
                            ? `Writers Slot: ${settings.homeWritersSlotReplacement.replace('_', ' ')}`
                            : 'Writers on Home: ON'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Control Homepage Writers section and Product Card Writer line right here or in the Writers tab.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={
                      settings.showHomeWritersSection === false &&
                      (!settings.homeWritersSlotReplacement ||
                        settings.homeWritersSlotReplacement === 'writers')
                        ? 'off'
                        : settings.homeWritersSlotReplacement || 'writers'
                    }
                    onChange={async e => {
                      const val = e.target.value as
                        | 'writers'
                        | 'publishers_spotlight'
                        | 'bestsellers_showcase'
                        | 'trust_features'
                        | 'reading_benefits'
                        | 'off';
                      await updateSettings({
                        showHomeWritersSection: val !== 'off',
                        homeWritersSlotReplacement: val,
                      });
                      setToast({
                        show: true,
                        type: 'success',
                        message:
                          val === 'off'
                            ? 'Homepage writer section turned OFF!'
                            : `Homepage writer slot set to: ${val.replace('_', ' ')}`,
                      });
                    }}
                    className="px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="writers">✍️ Home Writers: Show Featured Authors</option>
                    <option value="publishers_spotlight">🏛️ Home Writers Slot → Official Publishers</option>
                    <option value="bestsellers_showcase">🔥 Home Writers Slot → Bestselling Books</option>
                    <option value="trust_features">🛡️ Home Writers Slot → Store Trust Guarantees</option>
                    <option value="reading_benefits">📖 Home Writers Slot → Look Inside Perks</option>
                    <option value="off">🚫 Home Writers: Turn OFF</option>
                  </select>

                  <select
                    value={settings.productCardWriterSlotMode || 'writer_name'}
                    onChange={async e => {
                      const val = e.target.value as
                        | 'writer_name'
                        | 'publisher_name'
                        | 'category_name'
                        | 'edition_info'
                        | 'delivery_badge'
                        | 'off';
                      await updateSettings({ productCardWriterSlotMode: val });
                      setToast({
                        show: true,
                        type: 'success',
                        message: 'Product card writer slot updated!',
                      });
                    }}
                    className="px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="writer_name">✍️ Card Writer: Show Writer Name</option>
                    <option value="publisher_name">🏛️ Card Writer → Publisher Name</option>
                    <option value="category_name">📚 Card Writer → Category Name</option>
                    <option value="edition_info">📖 Card Writer → Edition & Print Info</option>
                    <option value="delivery_badge">🚚 Card Writer → Fast COD Tag</option>
                    <option value="off">🚫 Card Writer: Turn OFF</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reaction Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-neutral-200">
                <div className="text-[10px] font-bold uppercase text-neutral-500">Total Synced Reviews</div>
                <div className="text-xl font-black text-neutral-900 mt-1">{reviews.length}</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div className="text-[10px] font-bold uppercase text-blue-700 flex items-center gap-1">
                  <ThumbsUp size={12} /> Total Likes
                </div>
                <div className="text-xl font-black text-blue-700 mt-1">
                  {reviews.reduce((sum, r) => sum + (r.likesCount || 0), 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#D71920]/25">
                <div className="text-[10px] font-bold uppercase text-[#D71920] flex items-center gap-1">
                  <Heart size={12} /> Total Loves
                </div>
                <div className="text-xl font-black text-[#D71920] mt-1">
                  {reviews.reduce((sum, r) => sum + (r.lovesCount || 0), 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                  <ThumbsDown size={12} /> Total Dislikes
                </div>
                <div className="text-xl font-black text-amber-800 mt-1">
                  {reviews.reduce((sum, r) => sum + (r.dislikesCount || 0), 0)}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map(rev => {
                  const prod = products.find(p => p.id === rev.productId);
                  return (
                    <div key={rev.id} className="p-4 rounded-2xl border border-neutral-200 bg-[#F7F7F8] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-neutral-900">{rev.userName}</span>
                          <span className="text-amber-500 font-bold text-xs">{'★'.repeat(rev.rating || 5)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600">
                            Book: {prod?.title || rev.productId}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-700 italic">"{rev.comment}"</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs">
                          <ThumbsUp size={12} className="text-blue-600" />
                          <span className="text-[10px] font-bold text-neutral-500">Like:</span>
                          <input
                            type="number"
                            min="0"
                            value={rev.likesCount ?? 0}
                            onChange={e => updateProductReview(rev.id, { likesCount: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-12 text-center font-black text-blue-600 bg-blue-50/50 rounded px-1 py-0.5"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-[#D71920]/30 text-xs">
                          <Heart size={12} className="text-[#D71920]" />
                          <span className="text-[10px] font-bold text-neutral-500">Love:</span>
                          <input
                            type="number"
                            min="0"
                            value={rev.lovesCount ?? 0}
                            onChange={e => updateProductReview(rev.id, { lovesCount: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-12 text-center font-black text-[#D71920] bg-[#FFF1F2] rounded px-1 py-0.5"
                          />
                        </div>

                        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 text-xs">
                          <ThumbsDown size={12} className="text-amber-700" />
                          <span className="text-[10px] font-bold text-neutral-500">Dislike:</span>
                          <input
                            type="number"
                            min="0"
                            value={rev.dislikesCount ?? 0}
                            onChange={e => updateProductReview(rev.id, { dislikesCount: Math.max(0, Number(e.target.value) || 0) })}
                            className="w-12 text-center font-black text-amber-800 bg-amber-50 rounded px-1 py-0.5"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteProductReview(rev.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F7F7F8] rounded-2xl border border-neutral-200 text-xs text-neutral-500">
                No custom reviews or reactions recorded in Firestore yet. When customers post reviews or react (Like / Love / Dislike) on any product page, they appear here in real time.
              </div>
            )}

            {showAddAdminRevModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h3 className="font-black text-neutral-900 text-base">Add Verified Customer Review</h3>
                    <button onClick={() => setShowAddAdminRevModal(false)} className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      if (!adminRevProdId || !adminRevUserName.trim() || !adminRevComment.trim()) return;
                      await addProductReview({
                        productId: adminRevProdId,
                        userName: adminRevUserName.trim(),
                        rating: adminRevRating,
                        comment: adminRevComment.trim(),
                        isVerifiedPurchase: true,
                        likesCount: 5,
                        lovesCount: 3,
                        dislikesCount: 0,
                        userReactions: {}
                      });
                      setShowAddAdminRevModal(false);
                      setToast({ show: true, type: 'success', message: 'Verified review added and synced to Firebase!' });
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Select Product</label>
                      <select
                        value={adminRevProdId}
                        onChange={e => setAdminRevProdId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Customer Name</label>
                      <input
                        type="text"
                        required
                        value={adminRevUserName}
                        onChange={e => setAdminRevUserName(e.target.value)}
                        placeholder="e.g. Mahmudul Hasan"
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Rating (1-5)</label>
                      <select
                        value={adminRevRating}
                        onChange={e => setAdminRevRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1">Review Comment</label>
                      <textarea
                        rows={3}
                        required
                        value={adminRevComment}
                        onChange={e => setAdminRevComment(e.target.value)}
                        placeholder="Write verified customer feedback..."
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddAdminRevModal(false)} className="px-4 py-2 bg-neutral-100 font-bold rounded-xl text-neutral-700 cursor-pointer">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-[#D71920] text-white font-bold rounded-xl shadow-sm cursor-pointer">Save Review</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ORDERS FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            
            {/* Minimal Order Header & Filter Bar */}
            <div className="space-y-3">
              {/* Row 1: Title, Search & Primary Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input 
                    type="text"
                    placeholder="Search orders by ID, customer name, phone, or address..."
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 focus:bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#D71920] transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => alert('Create Order modal triggered.')}
                    className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                  >
                    <Plus size={14} /> <span>Create Order</span>
                  </button>

                  <button 
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw size={13} /> <span>Sync</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Clean Scrollable Status Tabs (Works smoothly on Mobile, Laptop & PC) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-neutral-100">
                {[
                  { id: 'all', label: 'All Orders', count: orders.length },
                  { id: 'pending', label: 'Pending', count: orders.filter(o => o.orderStatus === 'pending').length },
                  { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.orderStatus === 'confirmed').length },
                  { id: 'processing', label: 'Processing', count: orders.filter(o => o.orderStatus === 'processing').length },
                  { id: 'shipped', label: 'Shipped', count: orders.filter(o => o.orderStatus === 'shipped').length },
                  { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.orderStatus === 'delivered').length },
                  { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.orderStatus === 'cancelled').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      orderStatusFilter === tab.id
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                      orderStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200/70 text-neutral-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Cards List */}
            <div className="space-y-3">
              {orders
                .filter(o => {
                  if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                  if (orderSearchQuery) {
                    const q = orderSearchQuery.toLowerCase();
                    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || (o.optionalPhone && o.optionalPhone.includes(q)) || o.address.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map(o => (
                  <div key={o.id} className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 transition-all">
                    
                    {/* Order Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-neutral-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-[#D71920] font-mono bg-[#FFF1F2] px-2.5 py-1 rounded-lg border border-[#D71920]/20">
                          #{o.id}
                        </span>
                        <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(o.createdAt).toLocaleString()}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 font-bold text-[10px]">
                          {o.district.toLowerCase().includes('dhaka') ? 'Inside Dhaka' : 'Outside Dhaka'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select 
                          value={o.orderStatus}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer focus:outline-none ${
                            o.orderStatus === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            o.orderStatus === 'delivered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            o.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Card Body - Responsive 1 col on mobile, 12 cols on desktop */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      
                      {/* Customer Info (4 cols) */}
                      <div className="lg:col-span-4 space-y-1.5">
                        <div className="font-extrabold text-sm text-neutral-900">
                          {o.customerName}
                        </div>
                        <div className="text-xs font-bold text-neutral-700 flex items-center gap-1.5 flex-wrap">
                          <span>{o.phone}</span>
                          {o.optionalPhone && (
                            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[11px] font-medium">
                              Alt: {o.optionalPhone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 leading-relaxed">
                          {o.address}, {o.city}, {o.district}
                        </div>
                        {o.notes && (
                          <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 font-medium mt-1">
                            Note: {o.notes}
                          </div>
                        )}
                      </div>

                      {/* Items Ordered (4 cols) */}
                      <div className="lg:col-span-4 space-y-1.5 bg-neutral-50 p-3 rounded-xl border border-neutral-200/70">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Ordered Items ({o.items.length})
                        </div>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {o.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-neutral-200/60">
                              <img src={item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} alt="" className="w-8 h-10 object-cover rounded border border-neutral-100 shrink-0" />
                              <div className="flex-1 min-w-0 text-xs">
                                <div className="font-bold text-neutral-900 truncate">{item.title}</div>
                                <div className="text-[11px] text-neutral-500">Qty: {item.quantity} × ৳{item.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals, Payment & Actions (4 cols) */}
                      <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200/70">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-400 block">Total Payable</span>
                            <div className="text-base font-black text-neutral-900">৳{o.total}</div>
                            <div className="text-[10px] text-neutral-500">Delivery: ৳{o.deliveryCharge}</div>
                          </div>
                          <div className="text-right space-y-1.5">
                            <span className="px-2 py-0.5 rounded bg-white text-neutral-700 text-[10px] font-bold border border-neutral-200 uppercase inline-block">
                              {o.paymentMethodName || 'Cash on Delivery'}
                            </span>
                            <div>
                              <select
                                value={o.paymentStatus}
                                onChange={(e) => updateOrderPaymentStatus(o.id, e.target.value as any)}
                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer border ${
                                  o.paymentStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  o.paymentStatus === 'pending_verification' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  o.paymentStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-white text-neutral-600 border-neutral-200'
                                }`}
                              >
                                <option value="unpaid">Unpaid</option>
                                <option value="pending_verification">Pending Verify</option>
                                <option value="approved">Paid</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Courier & Actions */}
                        <div className="space-y-2">
                          {(o.courierName || o.trackingCode) && (
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg px-2.5 py-1.5 text-xs flex items-center justify-between">
                              <span className="font-bold text-amber-900 truncate text-[11px]">
                                🚚 {o.courierName || 'Courier'}: {o.trackingCode || 'Assigned'}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => {
                                setTrackingModalOrder(o);
                                setCourierNameInput(o.courierName || 'Steadfast');
                                setTrackingCodeInput(o.trackingCode || '');
                                setTrackingUrlInput(o.trackingUrl || '');
                                setTrackingNotesInput(o.trackingNotes || '');
                                setTrackingStatusInput(o.orderStatus);
                              }}
                              className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Truck size={13} />
                              <span>{o.courierName || o.trackingCode ? 'Edit Tracking' : 'Assign Courier'}</span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => alert(`Order ID: ${o.id}\nCustomer: ${o.customerName}\nPhone: ${o.phone}${o.optionalPhone ? `\nOptional Phone: ${o.optionalPhone}` : ''}\nAddress: ${o.address}, ${o.city}\nTotal: ৳${o.total}\nPayment: ${o.paymentMethodName || 'COD'} (${o.paymentStatus})`)}
                                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer text-xs"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => window.print()}
                                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 text-neutral-600 cursor-pointer text-xs"
                                title="Print Invoice"
                              >
                                🖨️
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete order #${o.id}?`)) {
                                    try {
                                      await deleteOrder(o.id);
                                      setToast({ show: true, type: 'success', message: `Order #${o.id} deleted.` });
                                    } catch (err: any) {
                                      setToast({ show: true, type: 'error', message: `Failed to delete order: ${err.message}` });
                                    }
                                  }
                                }} 
                                className="p-2 rounded-xl border border-red-100 bg-red-50/60 hover:bg-red-100 text-red-600 cursor-pointer transition-colors" 
                                title="Delete Order"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                ))}

              {orders.filter(o => {
                if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                if (orderSearchQuery) {
                  const q = orderSearchQuery.toLowerCase();
                  return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || (o.optionalPhone && o.optionalPhone.includes(q)) || o.address.toLowerCase().includes(q);
                }
                return true;
              }).length === 0 && (
                <div className="text-center py-12 bg-neutral-50/70 rounded-2xl border border-dashed border-neutral-200">
                  <Package size={28} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-xs font-bold text-neutral-600">No matching orders found</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">New customer orders will appear here automatically</p>
                </div>
              )}
            </div>

            {/* Courier & Order Tracking Modal */}
            {trackingModalOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#D71920]/10 text-[#D71920] flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-neutral-900 text-base">Assign Courier & Live Tracking</h3>
                        <p className="text-xs text-neutral-500 font-mono">Order #{trackingModalOrder.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setTrackingModalOrder(null)} 
                      className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="bg-[#F7F7F8] p-3 rounded-2xl border border-neutral-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-neutral-800">
                      <span>👤 {trackingModalOrder.customerName}</span>
                      <span>📞 {trackingModalOrder.phone}</span>
                    </div>
                    <p className="text-neutral-500 text-[11px] truncate">
                      📍 {trackingModalOrder.address}, {trackingModalOrder.city}, {trackingModalOrder.district}
                    </p>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setTrackingSaving(true);
                      try {
                        let finalUrl = trackingUrlInput.trim();
                        if (!finalUrl && trackingCodeInput.trim()) {
                          if (courierNameInput.toLowerCase().includes('steadfast')) {
                            finalUrl = `https://steadfast.com.bd/t/${encodeURIComponent(trackingCodeInput.trim())}`;
                          } else if (courierNameInput.toLowerCase().includes('pathao')) {
                            finalUrl = `https://pathao.com/courier/tracking/?consignment_id=${encodeURIComponent(trackingCodeInput.trim())}`;
                          } else if (courierNameInput.toLowerCase().includes('redx')) {
                            finalUrl = `https://redx.com.bd/track-order/?trackingId=${encodeURIComponent(trackingCodeInput.trim())}`;
                          }
                        }

                        await updateOrderTracking(trackingModalOrder.id, {
                          courierName: courierNameInput,
                          trackingCode: trackingCodeInput.trim(),
                          trackingUrl: finalUrl,
                          trackingNotes: trackingNotesInput.trim(),
                          orderStatus: trackingStatusInput
                        });
                        setTrackingModalOrder(null);
                      } catch (err: any) {
                        alert('Failed to update tracking: ' + err.message);
                      } finally {
                        setTrackingSaving(false);
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                          Courier Partner
                        </label>
                        <select
                          value={courierNameInput}
                          onChange={e => setCourierNameInput(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                        >
                          <option value="Steadfast">Steadfast Courier</option>
                          <option value="Pathao">Pathao Courier</option>
                          <option value="RedX">RedX Delivery</option>
                          <option value="Paperfly">Paperfly</option>
                          <option value="eCourier">eCourier</option>
                          <option value="Sundarban Courier">Sundarban Courier</option>
                          <option value="SA Paribahan">SA Paribahan</option>
                          <option value="In-House Delivery">In-House Delivery (Rider)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                          Order Status
                        </label>
                        <select
                          value={trackingStatusInput}
                          onChange={e => setTrackingStatusInput(e.target.value as any)}
                          className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped (In Transit)</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                        Courier Consignment / Tracking Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 241020XYZ888"
                        value={trackingCodeInput}
                        onChange={e => setTrackingCodeInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white font-mono text-neutral-900 font-bold focus:outline-none focus:border-[#D71920]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                        Courier Live Tracking URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="Leave blank to auto-generate for Steadfast/Pathao"
                        value={trackingUrlInput}
                        onChange={e => setTrackingUrlInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:border-[#D71920]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                        Customer Tracking Note / Dispatch Remark
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Parcel dispatched via Steadfast, expected delivery within 48h."
                        value={trackingNotesInput}
                        onChange={e => setTrackingNotesInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-800 focus:outline-none focus:border-[#D71920]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setTrackingModalOrder(null)}
                        className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={trackingSaving}
                        className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        {trackingSaving ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving Tracking...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>Save & Update Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CATALOG & INVENTORY */}
        {activeTab === 'products' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            {!showAddProdModal ? (
              <>
                {/* Header matching Categories style */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">Books & Stationery Inventory</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/25 text-xs font-bold">
                          {products.length} items
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Manage catalog items, pricing, preview pages, and delivery timing
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowBulkImportModal(true)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#F7F7F8] hover:bg-neutral-200 text-neutral-800 border border-neutral-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 transition-all"
                    >
                      <FileSpreadsheet size={14} className="text-[#D71920]" />
                      <span>Bulk Import (CSV)</span>
                    </button>
                    <button 
                      onClick={() => setShowTypeChooserModal(true)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-all"
                    >
                      <Plus size={14} /> <span>Add New Product</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter Bar matching Categories */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F7F7F8] p-3 rounded-2xl border border-[#E5E5E5]">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search books by title, author, publisher, or category..."
                      value={productSearchQuery}
                      onChange={e => setProductSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {[
                      { id: 'all', label: `All (${products.length})` },
                      { id: 'book', label: `Books (${products.filter(p => p.type === 'book').length})` },
                      { id: 'stationery', label: `Stationery (${products.filter(p => p.type === 'stationery').length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setInventoryFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          inventoryFilter === tab.id
                            ? 'bg-[#D71920] text-white shadow-xs'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Single-Line Products Table (Matching Categories single-line row layout) */}
                <div className="overflow-x-auto border border-[#E5E5E5] rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[720px]">
                    <thead>
                      <tr className="bg-[#F7F7F8] text-neutral-500 font-bold uppercase tracking-wider border-b border-[#E5E5E5] text-[11px]">
                        <th className="py-3 px-4 w-10 text-center">
                          <input type="checkbox" className="accent-[#D71920] rounded" />
                        </th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Author / Publisher</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]">
                      {products
                        .filter(p => inventoryFilter === 'all' || p.type === inventoryFilter)
                        .filter(p => {
                          if (!productSearchQuery.trim()) return true;
                          const q = productSearchQuery.toLowerCase();
                          return (
                            p.title.toLowerCase().includes(q) ||
                            (p.author || '').toLowerCase().includes(q) ||
                            (p.publisher || '').toLowerCase().includes(q) ||
                            (p.category || '').toLowerCase().includes(q)
                          );
                        })
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-[#FFF9F9] transition-colors group">
                            <td className="py-3 px-4 text-center">
                              <input type="checkbox" className="accent-[#D71920] rounded" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-200 bg-neutral-50 p-0.5 flex items-center justify-center">
                                  {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain rounded-lg" />
                                  ) : (
                                    <BookOpen size={16} className="text-[#D71920]" />
                                  )}
                                </div>
                                <div className="min-w-0 max-w-[220px] sm:max-w-[260px]">
                                  <h4 className="font-black text-xs text-neutral-900 truncate" title={p.title}>
                                    {p.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    {p.sku && (
                                      <span className="text-[10px] text-neutral-400 font-mono">#{p.sku}</span>
                                    )}
                                    {p.previewPages && p.previewPages.length > 0 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20">
                                        📖 {p.previewPages.length}p
                                      </span>
                                    )}
                                    {p.deliveryEstimate && (
                                      <span className="text-[10px] text-neutral-500 truncate">
                                        • {p.deliveryEstimate}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="min-w-0 max-w-[180px]">
                                <div className="font-bold text-neutral-800 truncate">
                                  {p.author || p.brand || '—'}
                                </div>
                                {p.publisher && (
                                  <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                                    {p.publisher}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[11px] font-bold truncate max-w-[150px]">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                                p.type === 'book'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}>
                                {p.type === 'book' ? 'Book' : 'Stationery'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-black text-sm text-[#D71920]">৳{p.price}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                {p.isOriginalBadge !== false ? 'Original' : 'Active'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  type="button"
                                  onClick={() => handleDuplicateProduct(p)}
                                  className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors"
                                  title="Duplicate / Copy Product (ডুপ্লিকেট করুন)"
                                >
                                  <Copy size={13} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => openEditProduct(p)}
                                  className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:text-[#D71920] hover:border-[#D71920] hover:bg-red-50/50 cursor-pointer transition-colors"
                                  title="Edit Product (এডিট করুন)"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => deleteProduct(p.id)}
                                  className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 cursor-pointer transition-colors"
                                  title="Delete Product (মুছে ফেলুন)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                      {products
                        .filter(p => inventoryFilter === 'all' || p.type === inventoryFilter)
                        .filter(p => {
                          if (!productSearchQuery.trim()) return true;
                          const q = productSearchQuery.toLowerCase();
                          return (
                            p.title.toLowerCase().includes(q) ||
                            (p.author || '').toLowerCase().includes(q) ||
                            (p.publisher || '').toLowerCase().includes(q) ||
                            (p.category || '').toLowerCase().includes(q)
                          );
                        }).length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-neutral-400 font-bold text-xs">
                            No matching products found in inventory.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              /* DEDICATED ADD / EDIT PRODUCT PAGE VIEW (MATCHING image_c4b27017.png & image_44c07b58.png) */
              <form onSubmit={handleCreateProduct} className="space-y-6">
                {/* Top Sticky-Style Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddProdModal(false)}
                      className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>← Back to Inventory</span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base sm:text-lg text-neutral-900">
                          {editingProductId ? 'Edit Product Details' : 'Add New Product'}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          prodType === 'book' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {prodType === 'book' ? '📚 Book Catalog' : '✏️ Stationery Catalog'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Configure general info, slug, description, specifications, delivery & pricing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddProdModal(false)}
                      className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <Check size={15} />
                      <span>{editingProductId ? 'Update Product' : 'Save Product'}</span>
                    </button>
                  </div>
                </div>

                {/* 2-COLUMN GRID (Matching image_c4b27017.png & image_44c07b58.png) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: 8 Columns */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* CARD 1: GENERAL INFORMATION */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                            <FileText size={16} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-neutral-900">General Information</h4>
                            <p className="text-[11px] text-neutral-500">Product name and detailed description</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#D71920] border border-[#D71920]/25">
                          Required *
                        </span>
                      </div>

                      {/* Product Title / Name */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                          Product Title / Name <span className="text-[#D71920]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={prodType === 'book' ? 'e.g. Paradoxical Sajid 2 (প্যারাডক্সিক্যাল সাজিদ ২)' : 'e.g. Premium Executive Leather Diary A5'}
                          value={prodTitle}
                          onChange={e => {
                            const val = e.target.value;
                            setProdTitle(val);
                            if (!isCustomSlug) {
                              setProdSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs transition-all"
                        />
                      </div>

                      {/* Product Slug / URL Handle with Edit Slug button */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-neutral-700">
                            Product Slug / URL Handle
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsCustomSlug(!isCustomSlug)}
                            className="text-[11px] font-bold text-[#D71920] hover:underline cursor-pointer"
                          >
                            {isCustomSlug ? 'Lock Slug' : 'Edit Slug'}
                          </button>
                        </div>
                        <div className="flex items-center rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] px-3.5 py-2 text-xs font-mono shadow-2xs">
                          <span className="text-neutral-500 font-bold shrink-0">store/product/</span>
                          <input
                            type="text"
                            readOnly={!isCustomSlug}
                            placeholder="e.g. product-slug-or-auto-generated"
                            value={prodSlug}
                            onChange={e => setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className={`w-full ml-1 bg-transparent text-[#D71920] font-bold focus:outline-none ${!isCustomSlug ? 'cursor-default' : ''}`}
                          />
                        </div>
                      </div>

                      {/* Product Description with Rich Toolbar & Feature Template */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-neutral-700">
                            Product Description
                          </label>
                        </div>

                        <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs">
                          {/* Formatting Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-[#F7F7F8] border-b border-[#E5E5E5] text-neutral-700">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="Bold"
                                onClick={() => setProdDescription(prev => prev + ' **বোল্ড লেখা** ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs font-black transition-colors"
                              >
                                <Bold size={13} />
                              </button>
                              <button
                                type="button"
                                title="Italic"
                                onClick={() => setProdDescription(prev => prev + ' *ইটালিক লেখা* ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs transition-colors"
                              >
                                <Italic size={13} />
                              </button>
                              <button
                                type="button"
                                title="Strikethrough"
                                onClick={() => setProdDescription(prev => prev + ' ~~কাটা লেখা~~ ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs transition-colors"
                              >
                                <Strikethrough size={13} />
                              </button>
                              <div className="w-[1px] h-4 bg-[#E5E5E5] mx-1" />
                              <button
                                type="button"
                                title="Bullet List"
                                onClick={() => setProdDescription(prev => prev + '\n• ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs transition-colors"
                              >
                                <List size={13} />
                              </button>
                              <button
                                type="button"
                                title="Numbered List"
                                onClick={() => setProdDescription(prev => prev + '\n1. ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs transition-colors"
                              >
                                <ListOrdered size={13} />
                              </button>
                              <button
                                type="button"
                                title="Quote"
                                onClick={() => setProdDescription(prev => prev + '\n> ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs transition-colors"
                              >
                                <Quote size={13} />
                              </button>
                              <button
                                type="button"
                                title="Code"
                                onClick={() => setProdDescription(prev => prev + ' `কোড` ')}
                                className="p-1.5 rounded-lg hover:bg-white hover:text-[#D71920] text-neutral-600 text-xs transition-colors"
                              >
                                <Code size={13} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const template = prodType === 'book'
                                  ? '\n\n📌 বইয়ের পরিচিতি ও বৈশিষ্ট্যসমূহ:\n• মূল লেখক: ' + (prodAuthor || 'প্রখ্যাত লেখক') + '\n• প্রকাশনী: ' + (prodPublisher || 'MR. BOOKS') + '\n• সারসংক্ষেপ: এই বইটিতে গভীর জীবনবোধ ও বাস্তব দৃষ্টিভঙ্গি চমৎকারভাবে উপস্থাপিত হয়েছে।\n• বাঁধাই ও কাগজের মান: উন্নত মানের ক্রিম পেপার ও শক্ত মজবুত বাঁধাই।\n• প্রতিটি বই ১০০% অরিজিনাল মুদ্রিত সংস্করণ।'
                                  : '\n\n📌 পণ্যের মূল বৈশিষ্ট্যসমূহ:\n• ব্র্যান্ড: ' + (prodBrand || 'MR. BOOKS Essentials') + '\n• উপাদান: ' + (prodMaterial || 'প্রিমিয়াম কোয়ালিটি') + '\n• আকার / সাইজ: ' + (prodDimensions || 'স্ট্যান্ডার্ড সাইজ') + '\n• দীর্ঘস্থায়ী, নিখুঁত ফিনিশিং ও প্রফেশনাল ব্যবহারের জন্য আদর্শ।';
                                setProdDescription(prev => prev + template);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-50 text-[#D71920] border border-neutral-200 text-[11px] font-bold cursor-pointer shadow-2xs transition-all"
                            >
                              + Feature Template
                            </button>
                          </div>

                          <textarea
                            rows={4}
                            placeholder="Enter detailed product description, benefits, and usage instructions..."
                            value={prodDescription}
                            onChange={e => setProdDescription(e.target.value)}
                            className="w-full p-3.5 bg-white text-xs font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none resize-y"
                          />
                        </div>
                      </div>

                      {/* Product Classifier: New Product vs New Featured Product */}
                      <div className="pt-2 border-t border-neutral-100">
                        <label className="block text-xs font-bold text-neutral-700 mb-2">
                          প্রোডাক্ট টাইপ নির্ধারণ (Product Classification) <span className="text-[#D71920]">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setProdClassification('new');
                              setProdBadge('NEW');
                              setProdIsFeatured(false);
                            }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              prodClassification === 'new'
                                ? 'bg-red-50 text-[#D71920] border-[#D71920] shadow-xs'
                                : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span>🆕</span>
                              <span>নিউ প্রোডাক্ট (New Product)</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-1">ক্যাটালগে নতুন বই হিসেবে হাইলাইট হবে</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProdClassification('featured');
                              setProdBadge('HOT');
                              setProdIsFeatured(true);
                            }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              prodClassification === 'featured'
                                ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-xs'
                                : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span>🔥</span>
                              <span>নিউ ফিচার প্রোডাক্ট (Featured)</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-1">হোমপেজ ও স্পেশাল ফিচার সেকশনে দেখাবে</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProdClassification('regular');
                              setProdBadge('Original');
                              setProdIsFeatured(false);
                            }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              prodClassification === 'regular'
                                ? 'bg-neutral-100 text-neutral-900 border-neutral-400 shadow-xs'
                                : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span>⭐</span>
                              <span>রেগুলার প্রোডাক্ট (Regular)</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-1">সাধারণ ক্যাটালগ ও ক্যাটাগরি আইটেম</p>
                          </button>
                        </div>
                      </div>

                      {/* Book Format: অরিজিনাল বই নাকি কপি বুক, প্রিন্টেড বুক নাকি পিডিএফ */}
                      {prodType === 'book' && (
                        <div className="pt-2 border-t border-neutral-100">
                          <label className="block text-xs font-bold text-neutral-700 mb-2">
                            বইয়ের ফরম্যাট ও ধরন (Book Edition & Format) <span className="text-[#D71920]">*</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { key: 'original', icon: '🛡️', label: 'অরিজিনাল বই', sub: 'Original Print' },
                              { key: 'copy', icon: '📑', label: 'কপি / রিপ্রিন্ট', sub: 'Reprint Copy' },
                              { key: 'printed', icon: '📖', label: 'প্রিন্টেড বই', sub: 'Standard Paper' },
                              { key: 'pdf', icon: '📱', label: 'ই-বুক / পিডিএফ', sub: 'PDF / Digital' },
                            ].map(fmt => (
                              <button
                                key={fmt.key}
                                type="button"
                                onClick={() => {
                                  setProdBookFormat(fmt.key as any);
                                  setProdIsOriginal(fmt.key === 'original');
                                }}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                  prodBookFormat === fmt.key
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold shadow-xs'
                                    : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                }`}
                              >
                                <div className="text-sm">{fmt.icon}</div>
                                <div className="text-xs font-bold mt-1 leading-tight">{fmt.label}</div>
                                <div className="text-[10px] text-neutral-400">{fmt.sub}</div>
                              </button>
                            ))}
                          </div>

                          {prodBookFormat === 'pdf' && (
                            <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                              <label className="block text-[11px] font-bold text-blue-900">
                                📱 পিডিএফ লিঙ্ক বা ই-বুক ফাইল ইউআরএল (PDF / eBook Link)
                              </label>
                              <input
                                type="url"
                                placeholder="https://example.com/books/sample-preview.pdf"
                                value={prodPdfUrl}
                                onChange={e => setProdPdfUrl(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-xs text-neutral-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Special Offer Deal (কোনো অফার চালাতে চাইলে সেই অফার অ্যাড করার অপশন) */}
                      <div className="pt-2 border-t border-neutral-100">
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-50/80 via-white to-amber-50/80 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-100 text-[#D71920] flex items-center justify-center shrink-0">
                              <Flame size={16} />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-xs text-neutral-900">
                                স্পেশাল অফার ডিল (Special Discount Offer)
                              </h5>
                              <p className="text-[11px] text-neutral-500">
                                এই প্রোডাক্টে কোনো বিশেষ ডিসকাউন্ট বা ক্যাম্পেইন অফার চালাতে চান?
                              </p>
                            </div>
                          </div>

                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={prodSpecialOfferActive}
                              onChange={e => setProdSpecialOfferActive(e.target.checked)}
                              className="w-4 h-4 text-[#D71920] accent-[#D71920] rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-neutral-800">
                              {prodSpecialOfferActive ? 'অফার সক্রিয় আছে' : 'অফার বন্ধ'}
                            </span>
                          </label>
                        </div>

                        {prodSpecialOfferActive && (
                          <div className="mt-3 p-3.5 bg-red-50/50 border border-red-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                            <div>
                              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                অফার শিরোনাম / ট্যাগ (Offer Title) *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. মেগা ডিসকাউন্ট অফার / ঈদ স্পেশাল ছাড় / Buy 1 Get 1"
                                value={prodSpecialOfferTitle}
                                onChange={e => setProdSpecialOfferTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                                অফার ডিসকাউন্ট পারসেন্ট (ঐচ্ছিক %)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  placeholder="e.g. 20"
                                  value={prodSpecialOfferDiscount}
                                  onChange={e => setProdSpecialOfferDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-lg border border-red-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CARD 2: BOOK DETAILS & ATTRIBUTES */}
                    {prodType === 'book' ? (
                      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D71920] border border-red-200/60 flex items-center justify-center">
                              <BookOpen size={16} />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-neutral-900">
                                Book Details
                              </h4>
                              <p className="text-[11px] text-neutral-500">
                                Writer, Publisher, Category, Pages, ISBN & SKU
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('publishers')}
                            className="text-[11px] font-bold text-[#D71920] hover:underline cursor-pointer"
                          >
                            + Manage Publishers
                          </button>
                        </div>

                        {/* Row 1: Writer Selection & Publisher Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Writer Selection */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-neutral-600 uppercase">
                                Writer <span className="text-[#D71920]">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setIsCustomAuthorInput(!isCustomAuthorInput)}
                                className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                              >
                                {isCustomAuthorInput ? 'Select from List' : '+ Custom Writer'}
                              </button>
                            </div>

                            {isCustomAuthorInput ? (
                              <input
                                type="text"
                                placeholder="Enter writer name (e.g. Arif Azad)"
                                value={prodAuthor}
                                onChange={e => setProdAuthor(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                              />
                            ) : (
                              <select
                                value={prodAuthor}
                                onChange={e => {
                                  if (e.target.value === '__custom__') {
                                    setIsCustomAuthorInput(true);
                                  } else {
                                    setProdAuthor(e.target.value);
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs cursor-pointer"
                              >
                                <option value="">-- Select Writer --</option>
                                {authors.map(a => (
                                  <option key={a.id} value={a.name}>
                                    ✍️ {a.name}
                                  </option>
                                ))}
                                <option value="__custom__">✏️ + Add Custom Writer...</option>
                              </select>
                            )}
                          </div>

                          {/* Publisher Selection (Category-style dropdown with auto book count) */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-neutral-600 uppercase">
                                Publisher <span className="text-[#D71920]">*</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setIsCustomPublisherInput(!isCustomPublisherInput)}
                                className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                              >
                                {isCustomPublisherInput ? 'Select from List' : '+ Custom Publisher'}
                              </button>
                            </div>

                            {isCustomPublisherInput ? (
                              <input
                                type="text"
                                placeholder="Enter publisher name (e.g. Guardian Publications)"
                                value={prodPublisher}
                                onChange={e => setProdPublisher(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                              />
                            ) : (
                              <select
                                value={prodPublisher}
                                onChange={e => {
                                  if (e.target.value === '__custom__') {
                                    setIsCustomPublisherInput(true);
                                  } else {
                                    setProdPublisher(e.target.value);
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs cursor-pointer"
                              >
                                <option value="">-- Select Publisher --</option>
                                {(publishers.length > 0 ? publishers : DEFAULT_PUBLISHERS_LIST).map(pub => {
                                  const pubBookCount = countBooksForPublisher(pub, products);
                                  return (
                                    <option key={pub.id} value={pub.name}>
                                      {pub.banglaName && pub.banglaName !== pub.name
                                        ? `${pub.name} (${pub.banglaName})`
                                        : pub.name}{' '}
                                      — ({pubBookCount} {pubBookCount === 1 ? 'Book' : 'Books'})
                                    </option>
                                  );
                                })}
                                <option value="__custom__">+ Add Custom Publisher...</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Row 2: Category, Pages, ISBN, SKU */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                          {/* Category */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              Category *
                            </label>
                            <select
                              value={prodCategory}
                              onChange={e => setProdCategory(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs cursor-pointer"
                            >
                              {categories
                                .filter(c => c.type === 'book')
                                .map(c => (
                                  <option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          {/* Pages */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              Pages
                            </label>
                            <input
                              type="number"
                              min={1}
                              placeholder="e.g. 240"
                              value={prodPages || ''}
                              onChange={e => setProdPages(Number(e.target.value))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                            />
                          </div>

                          {/* ISBN */}
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              ISBN Code
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 9789849312341"
                              value={prodIsbn}
                              onChange={e => setProdIsbn(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                            />
                          </div>

                          {/* SKU */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold text-neutral-600 uppercase">
                                SKU Code
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setProdSku('BK-' + Math.floor(1000 + Math.random() * 9000));
                                }}
                                className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                              >
                                Auto-gen
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. BK-PS2-PB"
                              value={prodSku}
                              onChange={e => setProdSku(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Row 3: Edition & Language */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              Edition (সংস্করণ)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1st Edition / ১ম প্রকাশ"
                              value={prodEdition}
                              onChange={e => setProdEdition(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              Language (ভাষা)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Bengali / English"
                              value={prodLanguage}
                              onChange={e => setProdLanguage(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Extra Custom Details */}
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                            Extra Custom Book Details (ঐচ্ছিক — প্রতি লাইনে LABEL: VALUE ফরম্যাটে লিখুন)
                          </label>
                          <textarea
                            rows={2}
                            placeholder={'Paper Quality: 80 GSM Cream Paper\nBinding: Hardcover Stitch'}
                            value={prodCustomDetailsText}
                            onChange={e => setProdCustomDetailsText(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
                            <Package size={16} />
                          </div>
                          <h4 className="font-extrabold text-sm text-neutral-900">
                            Stationery Specifications (Brand, Material, Dimensions & Color)
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Brand / Manufacturer *</label>
                            <input
                              type="text"
                              placeholder="e.g. Deli / Faber-Castell"
                              required
                              value={prodBrand}
                              onChange={e => setProdBrand(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Material</label>
                            <input
                              type="text"
                              placeholder="e.g. Leather / Paper / Steel"
                              value={prodMaterial}
                              onChange={e => setProdMaterial(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Dimensions / Size</label>
                            <input
                              type="text"
                              placeholder="e.g. A5 / 0.5mm / 21x14 cm"
                              value={prodDimensions}
                              onChange={e => setProdDimensions(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Color / Model</label>
                            <input
                              type="text"
                              placeholder="e.g. Matte Black / Navy Blue"
                              value={prodColorModel}
                              onChange={e => setProdColorModel(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD 3: CUSTOMER REVIEWS (প্রোডাক্টের উপর কাস্টমার রিভিউ অ্যাড করার অপশন) */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
                            <Star size={16} className="fill-amber-500 text-amber-500" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-neutral-900">
                              Customer Reviews (কাস্টমার রিভিউ যুক্ত করুন)
                            </h4>
                            <p className="text-[11px] text-neutral-500">
                              এই বইটির জন্য আসল ক্রেতাদের রিভিউ ও রেটিং যুক্ত করুন (সিঙ্গেল প্রোডাক্ট পেজে প্রদর্শিত হবে)
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                          {inFormReviews.length} Reviews
                        </span>
                      </div>

                      {/* Add Review Inline Form */}
                      <div className="p-4 rounded-xl bg-[#FBFBFC] border border-[#E8E8E9] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              ক্রেতার নাম (Customer Name) *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. রাকিব হাসান / সুমাইয়া জান্নাত"
                              value={newRevName}
                              onChange={e => setNewRevName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs"
                            />
                          </div>
                          <div className="sm:col-span-6">
                            <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                              রেটিং (Star Rating)
                            </label>
                            <div className="flex items-center gap-1.5 pt-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setNewRevRating(star)}
                                  className="p-1 rounded hover:bg-neutral-100 cursor-pointer transition-colors"
                                >
                                  <Star
                                    size={18}
                                    className={star <= newRevRating ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}
                                  />
                                </button>
                              ))}
                              <span className="text-xs font-black text-amber-700 ml-1.5">{newRevRating}.0 Stars</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                            রিভিউ মন্তব্য / ফিডব্যাক (Review Comment) *
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. বইটি সত্যিই অসাধারণ, পেপার কোয়ালিটি খুব ভালো এবং প্যাকেজিং নিরাপদ ছিল।"
                            value={newRevComment}
                            onChange={e => setNewRevComment(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs resize-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={newRevVerified}
                              onChange={e => setNewRevVerified(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                              <ShieldCheck size={13} className="text-emerald-600" /> Verified Purchase (আসল ক্রেতা)
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              if (!newRevName.trim()) {
                                setToast({ show: true, type: 'error', message: 'ক্রেতার নাম লিখুন' });
                                return;
                              }
                              if (!newRevComment.trim()) {
                                setToast({ show: true, type: 'error', message: 'রিভিউ মন্তব্য লিখুন' });
                                return;
                              }
                              const newRevItem = {
                                id: `rev-local-${Date.now()}`,
                                userName: newRevName.trim(),
                                rating: newRevRating,
                                comment: newRevComment.trim(),
                                isVerifiedPurchase: newRevVerified,
                                createdAt: Date.now()
                              };
                              setInFormReviews(prev => [newRevItem, ...prev]);
                              setNewRevName('');
                              setNewRevComment('');
                              setNewRevRating(5);
                              setToast({ show: true, type: 'success', message: 'রিভিউ যুক্ত হয়েছে!' });
                            }}
                            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all self-end"
                          >
                            <Plus size={14} />
                            <span>রিভিউ যুক্ত করুন</span>
                          </button>
                        </div>
                      </div>

                      {/* Display Existing Reviews List */}
                      {inFormReviews.length === 0 ? (
                        <div className="p-4 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/60 text-center">
                          <p className="text-xs text-neutral-500">
                            এখনো কোনো রিভিউ যোগ করা হয়নি। উপরের ফর্ম থেকে বইটির জন্য ক্রেতার রিভিউ যুক্ত করতে পারেন।
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          {inFormReviews.map((rev, idx) => (
                            <div
                              key={rev.id || idx}
                              className="p-3 rounded-xl border border-neutral-200 bg-white flex items-start justify-between gap-3 shadow-2xs hover:border-neutral-300 transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h6 className="font-extrabold text-xs text-neutral-900">{rev.userName}</h6>
                                  {rev.isVerifiedPurchase && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                                      ✓ Verified
                                    </span>
                                  )}
                                  <div className="flex items-center text-amber-500">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={11}
                                        className={i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-200'}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-700">{rev.comment}</p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setInFormReviews(prev => prev.filter((_, i) => i !== idx));
                                  if (rev.id && !rev.id.startsWith('rev-local-')) {
                                    deleteProductReview(rev.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors shrink-0"
                                title="মুছুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CARD 4: PER-BOOK DELIVERY SYSTEM (ডেলিভারি সিস্টেম ও কুরিয়ার চার্জ নির্ধারণ) */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D71920] border border-red-200/60 flex items-center justify-center">
                            <Truck size={16} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-neutral-900">
                              Delivery System & Charges (ডেলিভারি সিস্টেম ও চার্জ)
                            </h4>
                            <p className="text-[11px] text-neutral-500">
                              ফ্রি ডেলিভারি, সুন্দরবন কুরিয়ার, হোম ডেলিভারি ও অন্যান্য কুরিয়ার চার্জ নির্ধারণ করুন
                            </p>
                          </div>
                        </div>

                        {/* Free Delivery Quick Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextFree = !prodIsFreeDelivery;
                            setProdIsFreeDelivery(nextFree);
                            setProdDeliveryChargeType(nextFree ? 'free' : 'custom');
                          }}
                          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            prodIsFreeDelivery
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <span>🎁</span>
                          <span>{prodIsFreeDelivery ? '✓ সম্পূর্ণ ফ্রি ডেলিভারি সক্রিয়' : 'এই বইয়ে ফ্রি ডেলিভারি দিন'}</span>
                        </button>
                      </div>

                      {/* If Free Delivery Banner */}
                      {prodIsFreeDelivery && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-2xs">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>এই বইটিতে কাস্টমারদের জন্য ডেলিভারি চার্জ সম্পূর্ণ ফ্রি (৳0) থাকবে।</span>
                        </div>
                      )}

                      {/* Courier Wise & Home Delivery Fee Section (English Only) */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. Inside Dhaka Fee */}
                          <div className="p-3 rounded-xl border border-neutral-200 bg-[#FBFBFC] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-neutral-700">
                                Inside Dhaka Fee
                              </label>
                              <span className="text-[10px] text-neutral-400">Dhaka City</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">৳</span>
                              <input
                                type="number"
                                min={0}
                                disabled={prodIsFreeDelivery}
                                placeholder="60"
                                value={prodIsFreeDelivery ? 0 : prodInsideDhakaFee}
                                onChange={e => setProdInsideDhakaFee(Number(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] disabled:bg-neutral-100"
                              />
                            </div>
                          </div>

                          {/* 2. Outside Dhaka Fee */}
                          <div className="p-3 rounded-xl border border-neutral-200 bg-[#FBFBFC] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-neutral-700">
                                Outside Dhaka Fee
                              </label>
                              <span className="text-[10px] text-neutral-400">Nationwide</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">৳</span>
                              <input
                                type="number"
                                min={0}
                                disabled={prodIsFreeDelivery}
                                placeholder="120"
                                value={prodIsFreeDelivery ? 0 : prodOutsideDhakaFee}
                                onChange={e => setProdOutsideDhakaFee(Number(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] disabled:bg-neutral-100"
                              />
                            </div>
                          </div>

                          {/* 3. Sub Area Fee */}
                          <div className="p-3 rounded-xl border border-neutral-200 bg-[#FBFBFC] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-neutral-700">
                                Sub Area Fee
                              </label>
                              <span className="text-[10px] text-neutral-400">Suburbs</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">৳</span>
                              <input
                                type="number"
                                min={0}
                                disabled={prodIsFreeDelivery}
                                placeholder="90"
                                value={prodIsFreeDelivery ? 0 : prodSubAreaFee}
                                onChange={e => setProdSubAreaFee(Number(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] disabled:bg-neutral-100"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Sundarban & Other Courier Fee Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Sundarban Courier Fee */}
                          <div className="p-3 rounded-xl border border-neutral-200 bg-[#FBFBFC] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-neutral-700">
                                Sundarban Courier Charge
                              </label>
                              <span className="text-[10px] text-neutral-400">Sundarban</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">৳</span>
                              <input
                                type="number"
                                min={0}
                                disabled={prodIsFreeDelivery}
                                placeholder="120"
                                value={prodIsFreeDelivery ? 0 : prodSundarbanDeliveryFee}
                                onChange={e => setProdSundarbanDeliveryFee(Number(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] disabled:bg-neutral-100"
                              />
                            </div>
                          </div>

                          {/* Other Courier Fee */}
                          <div className="p-3 rounded-xl border border-neutral-200 bg-[#FBFBFC] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-[11px] font-bold text-neutral-700">
                                Other Courier Charge
                              </label>
                              <span className="text-[10px] text-neutral-400">Steadfast/SA</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">৳</span>
                              <input
                                type="number"
                                min={0}
                                disabled={prodIsFreeDelivery}
                                placeholder="100"
                                value={prodIsFreeDelivery ? 0 : prodOtherCourierDeliveryFee}
                                onChange={e => setProdOtherCourierDeliveryFee(Number(e.target.value))}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] disabled:bg-neutral-100"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Weight-Based Extra Charge Note (Editable) */}
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 shadow-2xs">
                          <label className="block text-[11px] font-bold text-amber-900 uppercase">
                            Weight-Based Extra Charge Note (Editable)
                          </label>
                          <input
                            type="text"
                            value={prodWeightNote}
                            onChange={e => setProdWeightNote(e.target.value)}
                            placeholder="Weight-based extra charge: ৳20 added per extra kg/item when weight increases."
                            className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                          />
                        </div>
                      </div>

                      {/* Delivery Timing Presets */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase">
                          ডেলিভারি টাইমিং প্রিসেট (Quick Presets)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '⚡ ২৪ ঘণ্টা এক্সপ্রেস', est: '২৪ ঘণ্টায় এক্সপ্রেস ডেলিভারি', inDhaka: '১২-২৪ ঘণ্টা', outDhaka: '১-২ দিন', hrs: 24 },
                            { label: '🚚 ১-২ দিন', est: '১-২ কার্যদিবস (1-2 Days)', inDhaka: '২৪ ঘণ্টা (১ দিন)', outDhaka: '১-২ কার্যদিবস', hrs: 36 },
                            { label: '📦 ২-৩ দিন (ডিফল্ট)', est: '২-৩ কার্যদিবস (2-3 Days)', inDhaka: '২৪-৪৮ ঘণ্টা (১-২ দিন)', outDhaka: '২-৩ কার্যদিবস (সারাদেশে)', hrs: 48 },
                            { label: '⏳ ৩-৫ দিন (প্রি-অর্ডার)', est: '৩-৫ কার্যদিবস (Pre-Order)', inDhaka: '২-৩ দিন', outDhaka: '৩-৫ কার্যদিবস', hrs: 96 },
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setProdDeliveryEstimate(preset.est);
                                setProdInsideDhakaDelivery(preset.inDhaka);
                                setProdOutsideDhakaDelivery(preset.outDhaka);
                                setProdDeliveryTimerHours(preset.hrs);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#F7F7F8] hover:bg-[#D71920] hover:text-white text-neutral-700 border border-neutral-200 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Timing Badge & Timer Hours & Custom Delivery Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                            Primary Delivery Badge *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. ২-৩ কার্যদিবস / 2-3 Days"
                            value={prodDeliveryEstimate}
                            onChange={e => setProdDeliveryEstimate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                            Timer Hours (ঘণ্টা)
                          </label>
                          <input
                            type="number"
                            min={1}
                            placeholder="48"
                            value={prodDeliveryTimerHours}
                            onChange={e => setProdDeliveryTimerHours(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                            Custom Delivery Note
                          </label>
                          <input
                            type="text"
                            placeholder="আজকে অর্ডার করলে দ্রুততম সময়ে পাঠানো হবে..."
                            value={prodDeliveryTimingNote}
                            onChange={e => setProdDeliveryTimingNote(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN: 4 Columns */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* WIDGET 1: PRODUCT STATUS */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs space-y-4">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-500">
                        PRODUCT STATUS
                      </h4>

                      {/* Visibility Status */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-2">
                          Visibility Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setProdIsActive(true)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                              prodIsActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                                : 'bg-[#F7F7F8] text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Active / Live</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProdIsActive(false)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                              !prodIsActive
                                ? 'bg-neutral-800 text-white border-neutral-800 shadow-xs'
                                : 'bg-[#F7F7F8] text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                            <span>Draft / Hidden</span>
                          </button>
                        </div>
                      </div>

                      {/* Featured / Hot Deal Switch */}
                      <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame size={16} className={prodIsFeatured ? 'text-[#D71920]' : 'text-neutral-400'} />
                          <span className="text-xs font-bold text-neutral-800">Featured / Hot Deal</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProdIsFeatured(!prodIsFeatured)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                            prodIsFeatured ? 'bg-[#D71920] justify-end' : 'bg-neutral-300 justify-start'
                          }`}
                        >
                          <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                        </button>
                      </div>

                      {/* Product Badge Selector */}
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-2">
                          Product Badge
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {['NEW', 'HOT', 'SALE', '100% Pure', 'Best Offer', '50% Off', 'Original'].map(badge => (
                            <button
                              key={badge}
                              type="button"
                              onClick={() => setProdBadge(badge)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                prodBadge === badge
                                  ? 'bg-[#D71920] text-white border-[#D71920] shadow-xs'
                                  : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {badge}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* WIDGET 2: PRICING */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs space-y-4">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-500">
                        PRICING
                      </h4>

                      {/* Regular Price */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-700">
                            রেগুলার মূল্য (Regular / Original Price)
                          </label>
                          <span className="text-[10px] text-neutral-400">(Optional - strikethrough)</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">৳</span>
                          <input
                            type="number"
                            min={0}
                            placeholder="450"
                            value={prodRegularPrice}
                            onChange={e => setProdRegularPrice(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Offer Price */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-700">
                            অফার মূল্য (Offer Price) <span className="text-[#D71920]">*</span>
                          </label>
                          <span className="text-[10px] text-emerald-600 font-bold">(Customer purchase price)</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">৳</span>
                          <input
                            type="number"
                            min={0}
                            required
                            placeholder="350"
                            value={prodPrice}
                            onChange={e => setProdPrice(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-white text-sm font-black text-emerald-700 focus:outline-none focus:border-emerald-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Dynamic Customer Savings Banner */}
                      {Number(prodRegularPrice) > Number(prodPrice) && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-bold shadow-2xs">
                          <div className="flex items-center gap-1.5">
                            <Tag size={13} className="text-amber-600" />
                            <span>Customer Savings:</span>
                          </div>
                          <span className="font-black text-amber-800">
                            ৳{Number(prodRegularPrice) - Number(prodPrice)} ({Math.round(((Number(prodRegularPrice) - Number(prodPrice)) / Number(prodRegularPrice)) * 100)}% OFF)
                          </span>
                        </div>
                      )}

                      <p className="text-[10px] text-neutral-400 text-center">
                        Purchase Cost Price দিলে প্রফিট হিসাব হবে
                      </p>
                    </div>

                    {/* WIDGET 3: PRODUCT GALLERY */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-500">
                          PRODUCT GALLERY
                        </h4>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {prodGalleryUrls.length} Images
                        </span>
                      </div>

                      {/* Dropzone Upload Box */}
                      <label className="border-2 border-dashed border-neutral-300 hover:border-[#D71920] hover:bg-[#FFF9F9] bg-[#F7F7F8] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-[#D71920] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload size={18} />
                        </div>
                        <span className="text-xs font-bold text-neutral-800 group-hover:text-[#D71920]">
                          Click to upload or drag image
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">
                          PNG, JPG, WEBP up to 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              try {
                                const compressedList = await Promise.all(
                                  files.map(f => compressImageFile(f, 800, 1100, 0.84))
                                );
                                setProdGalleryUrls(prev => Array.from(new Set([...prev, ...compressedList])));
                                if (!prodImage && compressedList.length > 0) {
                                  setProdImage(compressedList[0]);
                                }
                                setToast({ show: true, type: 'success', message: `${files.length}টি ছবি সফলভাবে আপলোড হয়েছে!` });
                              } catch (err: any) {
                                setToast({ show: true, type: 'error', message: err.message || 'Upload failed' });
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {/* Paste Image URL Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          placeholder="Or paste image URL..."
                          value={galleryUrlInput}
                          onChange={e => setGalleryUrlInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (galleryUrlInput.trim()) {
                                setProdGalleryUrls(prev => Array.from(new Set([...prev, galleryUrlInput.trim()])));
                                if (!prodImage) setProdImage(galleryUrlInput.trim());
                                setGalleryUrlInput('');
                              }
                            }
                          }}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (galleryUrlInput.trim()) {
                              setProdGalleryUrls(prev => Array.from(new Set([...prev, galleryUrlInput.trim()])));
                              if (!prodImage) setProdImage(galleryUrlInput.trim());
                              setGalleryUrlInput('');
                            }
                          }}
                          className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Gallery Thumbnails Grid */}
                      {prodGalleryUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          {prodGalleryUrls.map((url, idx) => (
                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-white aspect-square p-1 shadow-2xs">
                              <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-contain rounded-lg" />
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-2xs">
                                  Cover
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setProdGalleryUrls(prev => prev.filter((_, i) => i !== idx));
                                  if (prodImage === url) {
                                    setProdImage(prodGalleryUrls.find(u => u !== url) || '');
                                  }
                                }}
                                className="absolute top-1 right-1 p-1 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* WIDGET 4: DELIVERY CHARGE */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-[#D71920]" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-500">
                          DELIVERY CHARGE
                        </h4>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProdDeliveryChargeType('standard')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                            prodDeliveryChargeType === 'standard'
                              ? 'bg-[#D71920] text-white border-[#D71920] shadow-xs'
                              : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdDeliveryChargeType('free')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                            prodDeliveryChargeType === 'free'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          ✨ Free
                        </button>
                        <button
                          type="button"
                          onClick={() => setProdDeliveryChargeType('custom')}
                          className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                            prodDeliveryChargeType === 'custom'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-[#F7F7F8] text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          Custom
                        </button>
                      </div>

                      {prodDeliveryChargeType === 'custom' && (
                        <div className="pt-2">
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Custom Delivery Charge (৳)
                          </label>
                          <input
                            type="number"
                            min={0}
                            placeholder="60"
                            value={prodCustomDeliveryFee}
                            onChange={e => setProdCustomDeliveryFee(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-2xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* WIDGET 5: CATEGORY & SKU */}
                    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 text-neutral-900 shadow-xs space-y-4">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-neutral-500">
                        CATEGORY & INVENTORY
                      </h4>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Category <span className="text-[#D71920]">*</span>
                        </label>
                        <select
                          value={prodCategory}
                          onChange={e => setProdCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                        >
                          {categories
                            .filter(c => c.type === prodType)
                            .map(c => (
                              <option key={c.id} value={c.name} className="bg-white text-neutral-900">
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {prodType === 'book' && (
                        <div>
                          <label className="block text-xs font-bold text-neutral-700 mb-1">
                            Publisher <span className="text-[#D71920]">*</span>
                          </label>
                          <select
                            value={prodPublisher}
                            onChange={e => setProdPublisher(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                          >
                            <option value="">-- Select Publisher --</option>
                            {(publishers.length > 0 ? publishers : DEFAULT_PUBLISHERS_LIST).map(pub => {
                              const pubBookCount = countBooksForPublisher(pub, products);
                              return (
                                <option key={pub.id} value={pub.name} className="bg-white text-neutral-900">
                                  {pub.name} ({pubBookCount} {pubBookCount === 1 ? 'Book' : 'Books'})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-neutral-700">
                            SKU Code
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newSku = (prodType === 'book' ? 'BK-' : 'ST-') + Math.floor(1000 + Math.random() * 9000);
                              setProdSku(newSku);
                            }}
                            className="text-[11px] font-bold text-[#D71920] hover:underline cursor-pointer"
                          >
                            Auto-gen
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder={prodType === 'book' ? 'e.g. BK-PS2-PB' : 'e.g. ST-DIARY-01'}
                          value={prodSku}
                          onChange={e => setProdSku(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* CARD 4 (FULL WIDTH): BOOK PREVIEW & LOOK INSIDE (বইয়ের কিছু অংশ পড়ুন) */}
                {prodType === 'book' && (
                  <div className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-5">
                    {/* Header with Title and Action Buttons */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D71920] border border-red-200/60 flex items-center justify-center shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-neutral-900">
                            বইয়ের কিছু অংশ পড়ুন — Book Preview & Look Inside
                          </h4>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Upload a PDF file, page images, or written preview pages for customers to read
                          </p>
                        </div>
                      </div>

                      {/* Upload & Add Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* PDF Upload */}
                        <input
                          id="book-preview-pdf-input"
                          type="file"
                          accept="application/pdf"
                          onChange={handleBookPdfUpload}
                          className="hidden"
                          disabled={pdfUploading}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('book-preview-pdf-input')?.click()}
                          disabled={pdfUploading}
                          className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <Upload size={14} />
                          <span>{pdfUploading ? 'প্রসেসিং...' : 'Upload PDF (২-৫ পেজ)'}</span>
                        </button>

                        {/* Page Images Upload */}
                        <input
                          id="book-preview-images-input"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBookPagesImageUpload}
                          className="hidden"
                          disabled={pdfUploading}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('book-preview-images-input')?.click()}
                          disabled={pdfUploading}
                          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <ImageIcon size={14} />
                          <span>Upload Page Images</span>
                        </button>

                        {/* Written Page Button */}
                        <button
                          type="button"
                          onClick={handleAddWrittenPreviewPage}
                          className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                        >
                          <Plus size={14} />
                          <span>লেখার পৃষ্ঠা যোগ করুন</span>
                        </button>
                      </div>
                    </div>

                    {/* Form Fields: Section Title, Subtitle, Intro Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                          হাইলাইট শিরোনাম (SECTION TITLE)
                        </label>
                        <input
                          type="text"
                          value={prodPreviewHighlightTitle}
                          onChange={e => setProdPreviewHighlightTitle(e.target.value)}
                          placeholder="বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                          সাব-টাইটেল (OPTIONAL SUBTITLE)
                        </label>
                        <input
                          type="text"
                          value={prodPreviewHighlightSubtitle}
                          onChange={e => setProdPreviewHighlightSubtitle(e.target.value)}
                          placeholder="বইয়ের কিছুটা পড়তে পারেন এখানে • পৃষ্ঠা স্লাইড করে পড়ুন"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                        বই সম্পর্কে কিছু কথা / ভূমিকা (SHOWN INSIDE BOOK PREVIEW)
                      </label>
                      <textarea
                        rows={2}
                        value={prodPreviewIntro}
                        onChange={e => setProdPreviewIntro(e.target.value)}
                        placeholder="বইটি সম্পর্কে বিশেষ কিছু কথা বা ভূমিকা লিখুন..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] focus:bg-white shadow-2xs resize-none"
                      />
                    </div>

                    {/* Preview Pages Cards or Empty Notice */}
                    {prodPreviewPages.length === 0 ? (
                      <div className="p-6 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/60 text-center">
                        <p className="text-xs text-neutral-500">
                          এখনো কোনো কাস্টম পৃষ্ঠা যোগ করা হয়নি। উপরে <strong>Upload PDF</strong>, <strong>Upload Page Images</strong> বা <strong>লেখার পৃষ্ঠা যোগ করুন</strong> বাটনে ক্লিক করে পৃষ্ঠা যুক্ত করতে পারেন।
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-700">
                            সংযুক্ত প্রিভিউ পৃষ্ঠা সমূহ ({prodPreviewPages.length}টি পৃষ্ঠা)
                          </span>
                          <button
                            type="button"
                            onClick={() => setProdPreviewPages([])}
                            className="text-[11px] font-bold text-[#D71920] hover:underline cursor-pointer"
                          >
                            সবগুলো মুছুন
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {prodPreviewPages.map((page, idx) => (
                            <div
                              key={page.id || idx}
                              className="p-3.5 rounded-xl border border-neutral-200 bg-[#FAFAFA] flex flex-col gap-2 relative group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-red-100 text-[#D71920] text-[11px] font-extrabold flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={page.title || ''}
                                    onChange={e => {
                                      const newTitle = e.target.value;
                                      setProdPreviewPages(prev => prev.map((p, i) => i === idx ? { ...p, title: newTitle } : p));
                                    }}
                                    placeholder={`পৃষ্ঠা ${idx + 1}`}
                                    className="px-2 py-1 rounded-lg border border-neutral-200 bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setProdPreviewPages(prev => movePreviewPage(prev, idx, 'up'))}
                                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 cursor-pointer"
                                      title="উপরে নিন"
                                    >
                                      <ArrowUp size={13} />
                                    </button>
                                  )}
                                  {idx < prodPreviewPages.length - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setProdPreviewPages(prev => movePreviewPage(prev, idx, 'down'))}
                                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 cursor-pointer"
                                      title="নিচে নিন"
                                    >
                                      <ArrowDown size={13} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setProdPreviewPages(prev => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, pageNumber: i + 1 })))}
                                    className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                    title="মুছুন"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              {page.imageUrl ? (
                                <div className="relative rounded-lg overflow-hidden border border-neutral-200 bg-white h-36 flex items-center justify-center">
                                  <img src={page.imageUrl} alt={page.title} className="max-h-full object-contain" />
                                  <span className="absolute bottom-1 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                                    ছবি প্রিভিউ
                                  </span>
                                </div>
                              ) : (
                                <textarea
                                  rows={3}
                                  value={page.content || ''}
                                  onChange={e => {
                                    const newContent = e.target.value;
                                    setProdPreviewPages(prev => prev.map((p, i) => i === idx ? { ...p, content: newContent } : p));
                                  }}
                                  placeholder="এই পৃষ্ঠার মূল পাঠ্য বা সারাংশ এখানে লিখুন..."
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 focus:outline-none focus:border-[#D71920] resize-none"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD 5 (FULL WIDTH): VARIANTS & OPTIONS (সাইজ ও সংস্করণ) */}
                <div className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-5 sm:p-6 text-neutral-900 shadow-xs space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-neutral-900">
                        Variants & Options
                      </h4>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Sizes, colors, and variant configurations
                      </p>
                    </div>
                  </div>

                  {/* Inner Box: Sizes & Size-Wise Pricing */}
                  <div className="bg-[#FBFBFC] border border-[#E8E8E9] rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-xs sm:text-sm text-neutral-900">
                          Sizes & Size-Wise Pricing (সাইজ অনুযায়ী মূল্য)
                        </h5>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold">
                          {customVariants.length} Sizes
                        </span>
                      </div>
                      
                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-neutral-500 font-semibold mr-1">Quick Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const baseP = Number(prodPrice) || 350;
                            const baseReg = Number(prodRegularPrice) || 450;
                            const baseSku = prodSku || 'BK-6530';
                            setCustomVariants([
                              { id: `var-${Date.now()}-1`, name: 'Paperback (পেপারব্যাক)', price: baseP, regularPrice: baseReg, stock: 100, sku: `${baseSku}-PB` },
                              { id: `var-${Date.now()}-2`, name: 'Hardcover (হার্ডকভার)', price: baseP + 100, regularPrice: baseReg + 100, stock: 50, sku: `${baseSku}-HC` },
                            ]);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          ⚡ Paperback & Hardcover
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const baseP = Number(prodPrice) || 350;
                            const baseReg = Number(prodRegularPrice) || 450;
                            const baseSku = prodSku || 'BK-6530';
                            setCustomVariants(prev => [
                              ...prev,
                              { id: `var-${Date.now()}-gift`, name: 'Gift Edition (উপহার বক্স)', price: baseP + 200, regularPrice: baseReg + 250, stock: 30, sku: `${baseSku}-GIFT` }
                            ]);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          ⚡ Gift Edition
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      ২টা বা ততোধিক সাইজ/সংস্করণের জন্য আলাদা আলাদা প্রাইস নির্ধারণ করতে পারেন
                    </p>

                    {/* Inputs row to add variant */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                          সাইজের নাম (SIZE NAME) *
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: Paperback, Hardcover বা 500g"
                          value={newVariantName}
                          onChange={e => setNewVariantName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                          অফার মূল্য / Offer Price (৳)
                        </label>
                        <input
                          type="number"
                          placeholder={`ডিফল্ট: ৳${prodPrice || 350}`}
                          value={newVariantOfferPrice}
                          onChange={e => setNewVariantOfferPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                          রেগুলার মূল্য / Regular (৳)
                        </label>
                        <input
                          type="number"
                          placeholder="ঐচ্ছিক (কাটা মূল্য)"
                          value={newVariantRegularPrice}
                          onChange={e => setNewVariantRegularPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs text-neutral-900 focus:outline-none focus:border-[#D71920] shadow-2xs"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!newVariantName.trim()) {
                              setToast({ show: true, type: 'error', message: 'সাইজ বা সংস্করণের নাম লিখুন' });
                              return;
                            }
                            const priceNum = typeof newVariantOfferPrice === 'number' && newVariantOfferPrice > 0 
                              ? newVariantOfferPrice 
                              : (Number(prodPrice) || 350);
                            const regNum = typeof newVariantRegularPrice === 'number' && newVariantRegularPrice > 0 
                              ? newVariantRegularPrice 
                              : (Number(prodRegularPrice) || undefined);
                            const autoSku = (prodSku || 'ITEM') + '-' + newVariantName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
                            setCustomVariants(prev => [
                              ...prev,
                              {
                                id: `var-${Date.now()}`,
                                name: newVariantName.trim(),
                                price: priceNum,
                                regularPrice: regNum,
                                stock: 100,
                                sku: autoSku,
                                ...(newVariantDescription.trim() ? { description: newVariantDescription.trim() } : {})
                              }
                            ]);
                            setNewVariantName('');
                            setNewVariantOfferPrice('');
                            setNewVariantRegularPrice('');
                            setNewVariantDescription('');
                          }}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <Plus size={14} />
                          <span>যোগ করুন</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="ঐচ্ছিক ফরম্যাট বিবরণ (Format description — যেমন: ১৮০ গ্রাম প্রিমিয়াম আর্ট পেপার ও হার্ডকভার বাঁধাই)"
                        value={newVariantDescription}
                        onChange={e => setNewVariantDescription(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-neutral-800 focus:outline-none focus:border-[#D71920] shadow-2xs"
                      />
                    </div>

                    {/* Variants list */}
                    {customVariants.length === 0 ? (
                      <div className="p-5 border-2 border-dashed border-neutral-200 rounded-xl bg-white text-center">
                        <p className="text-xs text-neutral-500">
                          কোনো সাইজ যুক্ত করা হয়নি। যদি প্রোডাক্টের একাধিক সাইজ বা সংস্করণ থাকে, উপরের ফিল্ড থেকে যুক্ত করুন।
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        {customVariants.map((v, idx) => (
                          <div
                            key={v.id || idx}
                            className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-2 shadow-2xs hover:border-neutral-300 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div>
                                  <h5 className="text-xs font-extrabold text-neutral-900">{v.name}</h5>
                                  <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                                    #{v.sku || 'SKU'} • Stock: {v.stock ?? 100}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xs font-extrabold text-[#D71920]">৳{v.price}</div>
                                  {v.regularPrice && v.regularPrice > v.price && (
                                    <div className="text-[10px] text-neutral-400 line-through">৳{v.regularPrice}</div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCustomVariants(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                  title="মুছুন"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder="এই ফরম্যাটের বিশেষ বিবরণ লিখুন (Description tab-এ অটো আপডেট হবে)..."
                              value={v.description || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setCustomVariants(prev => prev.map((item, i) => (i === idx ? { ...item, description: val } : item)));
                              }}
                              className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white text-[11px] text-neutral-700 focus:outline-none focus:border-[#D71920]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Original Badge & Submit Buttons (Single unified bar) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-200">
                  {prodType === 'book' ? (
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={prodIsOriginal} 
                        onChange={e => setProdIsOriginal(e.target.checked)} 
                        className="w-4 h-4 text-[#D71920] accent-[#D71920] rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-emerald-600" /> Show &quot;অরিজিনাল বই&quot; (Original Book Verified Badge)
                      </span>
                    </label>
                  ) : <div />}

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddProdModal(false)}
                      className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-7 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <Check size={15} />
                      <span>{editingProductId ? 'Update Product' : 'Save Product'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* PRODUCT TYPE CHOOSER MODAL (1- Stationery vs 2- Books) */}
            {showTypeChooserModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <h3 className="text-base font-extrabold text-neutral-900">
                        Select Product Catalog Type (প্রোডাক্ট নির্বাচন)
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        নতুন প্রোডাক্ট যোগ করতে নিচের যে কোনো একটি অপশন সিলেক্ট করুন:
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTypeChooserModal(false)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Stationery */}
                    <button
                      type="button"
                      onClick={() => handleStartAddProduct('stationery')}
                      className="group relative p-5 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:bg-blue-50/30 text-left transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Package size={24} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-neutral-900 group-hover:text-blue-600">
                              1. Stationery
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              স্টেশনারি
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                            খাতা, ডায়েরি, কলম, বুকমার্ক, অফিস সরঞ্জাম ও গিফট এক্সেসরিজ যুক্ত করুন।
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1 text-xs font-bold text-blue-600">
                        <span>স্টেশনারি সিলেক্ট করুন</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    {/* Option 2: Books */}
                    <button
                      type="button"
                      onClick={() => handleStartAddProduct('book')}
                      className="group relative p-5 rounded-2xl border-2 border-neutral-200 hover:border-[#D71920] hover:bg-red-50/30 text-left transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#D71920] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm text-neutral-900 group-hover:text-[#D71920]">
                              2. Books
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#D71920]">
                              বই ও সাহিত্য
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                            উপন্যাস, সাহিত্য, ইসলামিক, একাডেমি বই, লেখক, প্রকাশনী ও প্রিভিউ স্লাইডার যুক্ত করুন।
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center gap-1 text-xs font-bold text-[#D71920]">
                        <span>বই সিলেক্ট করুন</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTypeChooserModal(false)}
                      className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 cursor-pointer"
                    >
                      বাতিল করুন (Cancel)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BULK CSV IMPORT MODAL */}
            <BulkProductImportModal
              isOpen={showBulkImportModal}
              onClose={() => setShowBulkImportModal(false)}
              onImportProducts={handleBulkImportProducts}
              categories={categories}
            />
          </div>
        )}

        {/* TAB: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Header with Title and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#EEEEEE]">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <span>Categories</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 text-xs font-bold">
                    {categories.length} items
                  </span>
                </h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingCatId(null);
                    setCatName('');
                    setCatType('book');
                    setCatImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80');
                    setCatShowOnHome(true);
                    setShowAddCatModal(true);
                  }}
                  className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer transition-colors"
                >
                  <Plus size={14} /> Category
                </button>
                <button 
                  onClick={() => {
                    setEditingCatId(null);
                    setCatName('');
                    setCatType('stationery');
                    setCatImage('https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80');
                    setCatShowOnHome(true);
                    setShowAddCatModal(true);
                  }}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md cursor-pointer transition-colors"
                >
                  <Plus size={14} /> Sub Category
                </button>
                <button 
                  onClick={() => {
                    setEditingCatId(null);
                    setCatName('');
                    setCatType('book');
                    setCatImage('https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80');
                    setCatShowOnHome(true);
                    setShowAddCatModal(true);
                  }}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                >
                  <Plus size={14} /> Child
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F7F7F8] p-3 rounded-2xl border border-[#E5E5E5]">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">🔍</span>
                <input 
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={e => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'main', label: '1 - Main' },
                  { id: 'sub', label: '2 - Sub' },
                  { id: 'child', label: '3 - Child' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilterTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      categoryFilterTab === tab.id ? 'bg-[#D71920] text-white shadow-xs' : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Professional Categories Table */}
            <div className="overflow-x-auto border border-[#E5E5E5] rounded-2xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F7F8] text-neutral-500 font-bold uppercase tracking-wider border-b border-[#E5E5E5] text-[11px]">
                    <th className="py-3 px-4 w-10 text-center"><input type="checkbox" className="accent-[#D71920] rounded" /></th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Parent</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEE]">
                  {categories
                    .filter(c => !categorySearchQuery || c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                    .map((cat, idx) => {
                      const itemCount = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                      return (
                        <tr key={cat.id} className="hover:bg-[#FFF9F9] transition-colors group">
                          <td className="py-3.5 px-4 text-center"><input type="checkbox" className="accent-[#D71920] rounded" /></td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100">
                                {cat.image ? (
                                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-[#FFF1F2] text-[#D71920] font-black flex items-center justify-center text-xs">
                                    {cat.name[0]}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-xs text-neutral-900 uppercase truncate">{cat.name}</h4>
                                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">/{cat.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 font-bold">—</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-black">
                              Main (1)
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 rounded-lg border border-neutral-200 w-fit">
                              <span className="font-bold text-neutral-800">{idx}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => updateCategory(cat.id, { showOnHome: !(cat.showOnHome !== false) })}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                                cat.showOnHome !== false
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                              }`}
                              title="Click to toggle status"
                            >
                              {cat.showOnHome !== false ? 'Active' : 'Hidden'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setCatName(cat.name);
                                  setCatType(cat.type);
                                  setCatImage(cat.image || '');
                                  setCatShowOnHome(cat.showOnHome !== false);
                                  setShowAddCatModal(true);
                                }}
                                className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:text-[#D71920] hover:border-[#D71920] cursor-pointer transition-colors"
                                title="Edit Category"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={() => deleteCategory(cat.id)}
                                className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:text-red-600 hover:border-red-300 cursor-pointer transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Modal for Add / Edit Category */}
            {showAddCatModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E5] space-y-5 my-8">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
                    <h3 className="text-lg font-black text-[#171717]">
                      {editingCatId ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <button 
                      onClick={() => setShowAddCatModal(false)}
                      className="text-[#777777] hover:text-[#171717] text-lg font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">Category Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Science Fiction & Space"
                        value={catName} 
                        onChange={e => setCatName(e.target.value)} 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">Category Type</label>
                      <select 
                        value={catType} 
                        onChange={e => setCatType(e.target.value as any)} 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      >
                        <option value="book">Book Category</option>
                        <option value="stationery">Stationery Category</option>
                      </select>
                    </div>

                    {/* Show on Homepage Toggle Switch */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5]">
                      <div>
                        <span className="font-bold text-xs text-[#171717] block">Show Category on Homepage (হোমপেজ অন বাটন)</span>
                        <span className="text-[10px] text-[#5F6368] leading-tight block mt-0.5">
                          Turn on to display this category's items in the homepage category slider.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCatShowOnHome(!catShowOnHome)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          catShowOnHome ? 'bg-[#D71920]' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            catShowOnHome ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Category Image Upload & URL */}
                    <div>
                      <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">
                        Category Picture (URL or Upload Image File)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          placeholder="https://example.com/category-photo.jpg"
                          value={catImage} 
                          onChange={e => setCatImage(e.target.value)} 
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                        <label className="px-4 py-2.5 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#D71920] hover:text-white transition-colors">
                          <Upload size={14} /> Upload
                          <input type="file" accept="image/*" onChange={handleCategoryFileUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Photo Preview & Presets */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E5E5E5] bg-neutral-100 shrink-0 flex items-center justify-center">
                          {catImage ? (
                            <img src={catImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#D71920] font-bold text-xs">Preview</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-[#5F6368] font-bold mb-1">Preset Pictures:</div>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { name: 'Novels', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' },
                              { name: 'Islamic', url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80' },
                              { name: 'Academic', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80' },
                              { name: 'Stationery', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80' }
                            ].map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setCatImage(preset.url)}
                                className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-[#FFF1F2] hover:text-[#D71920] border border-[#E5E5E5] font-semibold cursor-pointer"
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEEEEE]">
                      <button 
                        type="button" 
                        onClick={() => setShowAddCatModal(false)}
                        className="px-5 py-2.5 bg-neutral-100 text-[#171717] font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} /> Save Category
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: BANNERS MANAGEMENT */}
        {activeTab === 'banners' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <ImageIcon size={20} className="text-[#D71920]" /> Hero Banners & Slider
                </h2>
                <p className="text-xs text-[#5F6368] mt-1">
                  Upload or link direct banner pictures. No forced text required, and the CTA button can be turned ON/OFF with custom text and destination link.
                </p>
              </div>
              <button 
                onClick={() => {
                  setEditingBannerId(null);
                  setBannerTitle('Special Offer Banner');
                  setBannerSubtitle('Explore our latest curated collection');
                  setBannerImage('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=85');
                  setBannerLink('/books');
                  setBannerBtnText('Explore Books');
                  setBannerShowText(false);
                  setBannerShowButton(true);
                  setBannerBtnPos('bottom-left');
                  setShowAddBannerModal(true);
                }}
                className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add New Banner
              </button>
            </div>

            {/* Banners List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {banners.map((b) => (
                <div key={b.id} className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-[#F7F7F8] flex flex-col justify-between shadow-2xs group">
                  <div className="relative h-44 sm:h-52 overflow-hidden bg-neutral-200">
                    <img 
                      src={b.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${
                        b.isActive !== false ? 'bg-emerald-600 text-white' : 'bg-neutral-600 text-white'
                      }`}>
                        {b.isActive !== false ? 'Active on Homepage' : 'Hidden / Inactive'}
                      </span>
                    </div>

                    {/* Button indicator if enabled */}
                    {b.showButton && (
                      <div className="absolute bottom-3 left-3 bg-[#D71920] text-white text-[11px] font-bold px-3 py-1 rounded-lg shadow-md flex items-center gap-1.5">
                        <span>{b.buttonText || 'Explore Books'}</span>
                        <Check size={12} />
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#171717]">
                        {b.showText ? 'Text Overlay Enabled' : 'Direct Picture Mode (Pure Image)'}
                      </span>
                      <span className="text-[11px] text-[#5F6368]">
                        Button: <strong>{b.showButton ? 'ON' : 'OFF'}</strong>
                      </span>
                    </div>

                    <div className="text-[11px] text-[#5F6368] truncate">
                      Link destination: <code className="bg-white px-1.5 py-0.5 rounded border border-[#E5E5E5] text-[#171717]">{b.linkUrl || '/books'}</code>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#EEEEEE]">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={async () => {
                            try {
                              const newStatus = b.isActive === false;
                              await updateBanner(b.id, { isActive: newStatus });
                              setToast({ show: true, type: 'success', message: `Banner ${newStatus ? 'activated on homepage' : 'hidden'} in real-time!` });
                            } catch (e: any) {
                              setToast({ show: true, type: 'error', message: 'Failed to update banner status' });
                            }
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                            b.isActive !== false ? 'text-neutral-700 bg-white border border-[#E5E5E5]' : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {b.isActive !== false ? 'Turn Off' : 'Turn On'}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingBannerId(b.id);
                            setBannerTitle(b.title || '');
                            setBannerSubtitle(b.subtitle || '');
                            setBannerImage(b.imageUrl);
                            setBannerLink(b.linkUrl || '/books');
                            setBannerBtnText(b.buttonText || 'Explore Books');
                            setBannerShowText(!!b.showText);
                            setBannerShowButton(b.showButton !== false);
                            setBannerBtnPos(b.buttonPosition || 'bottom-left');
                            setShowAddBannerModal(true);
                          }}
                          className="text-xs text-[#171717] hover:text-[#D71920] font-semibold flex items-center gap-1 px-2 py-1 rounded cursor-pointer"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                      </div>

                      {banners.length > 1 && (
                        <button 
                          onClick={async () => {
                            try {
                              await deleteBanner(b.id);
                              setToast({ show: true, type: 'success', message: 'Banner removed in real-time!' });
                            } catch (e: any) {
                              setToast({ show: true, type: 'error', message: 'Failed to remove banner' });
                            }
                          }}
                          className="text-xs text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Banner Modal */}
            {showAddBannerModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E5] space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
                    <h3 className="text-lg font-black text-[#171717]">
                      {editingBannerId ? 'Edit Hero Banner' : 'Add New Hero Banner'}
                    </h3>
                    <button 
                      onClick={() => setShowAddBannerModal(false)}
                      className="text-[#777777] hover:text-[#171717] text-lg font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                    {/* Banner Image Input & File Upload */}
                    <div>
                      <label className="block font-bold text-[#171717] mb-1.5 uppercase tracking-wider text-[11px]">
                        Banner Picture (Direct Image URL or Upload from Device)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          required 
                          value={bannerImage} 
                          onChange={e => setBannerImage(e.target.value)} 
                          placeholder="https://example.com/banner.jpg"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                        <label className="px-4 py-2.5 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#D71920] hover:text-white transition-colors">
                          <Upload size={14} /> Upload
                          <input type="file" accept="image/*" onChange={handleBannerFileUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Quick Presets */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-[#5F6368] font-bold">Quick Presets:</span>
                        {[
                          { name: 'Book Fair Promo', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=85' },
                          { name: 'Bestselling Novels', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&auto=format&fit=crop&q=85' },
                          { name: 'Classic Library', url: 'https://images.unsplash.com/photo-1507842229458-5d27804473b6?w=1600&auto=format&fit=crop&q=85' },
                          { name: 'Stationery Art', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1600&auto=format&fit=crop&q=85' }
                        ].map((preset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setBannerImage(preset.url)}
                            className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-[#FFF1F2] hover:text-[#D71920] border border-[#E5E5E5] font-semibold cursor-pointer"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direct Picture Mode / Text Toggle */}
                    <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#171717] block">Text on Banner</span>
                          <span className="text-[11px] text-[#5F6368]">
                            Keep OFF for direct picture without forced titles/subtitles.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={bannerShowText} 
                            onChange={e => setBannerShowText(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71920]"></div>
                        </label>
                      </div>

                      {bannerShowText && (
                        <div className="space-y-2 pt-2 border-t border-[#E5E5E5]">
                          <input 
                            type="text" 
                            placeholder="Banner Main Headline" 
                            value={bannerTitle} 
                            onChange={e => setBannerTitle(e.target.value)} 
                            className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                          />
                          <input 
                            type="text" 
                            placeholder="Banner Subtitle / Description" 
                            value={bannerSubtitle} 
                            onChange={e => setBannerSubtitle(e.target.value)} 
                            className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Button Controls: Admin can turn button ON or OFF */}
                    <div className="p-4 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[#171717] block">Show Action Button on Banner</span>
                          <span className="text-[11px] text-[#5F6368]">
                            If turned ON, displays the clickable button on the banner; otherwise stays OFF.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={bannerShowButton} 
                            onChange={e => setBannerShowButton(e.target.checked)} 
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71920]"></div>
                        </label>
                      </div>

                      {bannerShowButton && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5E5E5]">
                          <div>
                            <label className="block font-bold text-[#5F6368] mb-1 text-[10px] uppercase">Button Text</label>
                            <input 
                              type="text" 
                              value={bannerBtnText} 
                              onChange={e => setBannerBtnText(e.target.value)} 
                              placeholder="Explore Books"
                              className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-[#5F6368] mb-1 text-[10px] uppercase">Destination Link</label>
                            <input 
                              type="text" 
                              value={bannerLink} 
                              onChange={e => setBannerLink(e.target.value)} 
                              placeholder="/books"
                              className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-[#5F6368] mb-1 text-[10px] uppercase">Button Position</label>
                            <select 
                              value={bannerBtnPos} 
                              onChange={e => setBannerBtnPos(e.target.value as any)}
                              className="w-full px-3 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                            >
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Preview Box */}
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-[#171717] mb-1.5 uppercase tracking-wider text-[11px]">
                        <Eye size={13} /> Live Banner Preview
                      </div>
                      <div className="relative rounded-2xl overflow-hidden border border-[#E5E5E5] h-44 sm:h-52 bg-neutral-100">
                        <img src={bannerImage} alt="Preview" className="w-full h-full object-cover" />
                        
                        {bannerShowText && (
                          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent p-5 flex flex-col justify-center text-white max-w-sm">
                            <h4 className="font-black text-lg sm:text-xl leading-tight">{bannerTitle || 'Your Headline'}</h4>
                            <p className="text-white/80 text-[11px] line-clamp-2 mt-1">{bannerSubtitle}</p>
                          </div>
                        )}

                        {bannerShowButton && (
                          <div className={`absolute ${
                            bannerBtnPos === 'bottom-center' ? 'bottom-4 left-1/2 -translate-x-1/2' :
                            bannerBtnPos === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'
                          }`}>
                            <div className="px-4 py-2 bg-[#D71920] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5">
                              {bannerBtnText || 'Explore Books'} <Check size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEEEEE]">
                      <button 
                        type="button" 
                        onClick={() => setShowAddBannerModal(false)}
                        className="px-5 py-2.5 bg-neutral-100 text-[#171717] font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={bannerSaving || bannerUploading}
                        className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-60 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        {bannerSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving to Firebase...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} /> 
                            <span>Save Banner</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: AUTHORS / WRITERS MANAGEMENT */}
        {activeTab === 'authors' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">
                    Writers & Author Profiles ({authors.length})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Manage author portraits, biographies, and published book counts
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search writers..."
                    value={authorSearchQuery}
                    onChange={e => setAuthorSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 focus:bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <button 
                  onClick={() => {
                    setEditingAuthorId(null);
                    setAuthorName('');
                    setAuthorBio('');
                    setAuthorPhoto('https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80');
                    setAuthorBooksCount(20);
                    setShowAddAuthorModal(true);
                  }}
                  className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0 transition-all"
                >
                  <Plus size={14} /> <span>Add Author</span>
                </button>
              </div>
            </div>

            {/* HOMEPAGE WRITER / AUTHOR VISIBILITY & FUTURE SLOT REPLACEMENT SYSTEM */}
            <div
              data-testid="admin-home-writer-system-panel"
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF1F2]/70 via-white to-emerald-50/40 border border-neutral-200/90 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/70">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D71920] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-neutral-900">
                        Customer Homepage Writer On/Off & Slot Replacement System
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          settings.showHomeWritersSection !== false &&
                          settings.homeWritersSlotReplacement !== 'off'
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {settings.showHomeWritersSection === false ||
                        settings.homeWritersSlotReplacement === 'off'
                          ? 'Homepage Writer Section: OFF'
                          : settings.homeWritersSlotReplacement &&
                              settings.homeWritersSlotReplacement !== 'writers'
                            ? `Replaced with: ${settings.homeWritersSlotReplacement.replace('_', ' ')}`
                            : 'Homepage Writer Section: SHOW (Active)'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Turn the Customer Homepage Writer section ON or OFF anytime, or replace that Homepage space & Product Card Writer line with another feature whenever you want.
                    </p>
                  </div>
                </div>

                {/* Quick Show / Off Master Switch for Homepage Writers */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="toggle-home-writers-show-btn"
                    onClick={async () => {
                      const nextSlot =
                        homeConfig.authorsSlotReplacement === 'off'
                          ? 'writers'
                          : homeConfig.authorsSlotReplacement || 'writers';
                      await updateHomeConfig({
                        showAuthors: true,
                        authorsSlotReplacement: nextSlot,
                      });
                      setToast({
                        show: true,
                        type: 'success',
                        message: 'Homepage Authors section enabled in homeConfig!',
                      });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all flex items-center gap-1.5 ${
                      homeConfig.showAuthors !== false &&
                      homeConfig.authorsSlotReplacement !== 'off'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Show on Home</span>
                  </button>
                  <button
                    type="button"
                    data-testid="toggle-home-writers-off-btn"
                    onClick={async () => {
                      await updateHomeConfig({
                        showAuthors: false,
                        authorsSlotReplacement: 'off',
                      });
                      setToast({
                        show: true,
                        type: 'success',
                        message: 'Homepage Authors section turned OFF in homeConfig!',
                      });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border cursor-pointer transition-all flex items-center gap-1.5 ${
                      homeConfig.showAuthors === false ||
                      homeConfig.authorsSlotReplacement === 'off'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <EyeOff size={13} />
                    <span>Turn Off</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Customer Homepage Writer Section Slot (Show Writers vs Replace with Feature vs Off) */}
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-neutral-900">
                    1. Customer Homepage Writer Section Slot (What to Show)
                  </label>
                  <select
                    data-testid="home-writers-slot-select"
                    value={
                      settings.showHomeWritersSection === false &&
                      (!settings.homeWritersSlotReplacement ||
                        settings.homeWritersSlotReplacement === 'writers')
                        ? 'off'
                        : settings.homeWritersSlotReplacement || 'writers'
                    }
                    onChange={async e => {
                      const val = e.target.value as
                        | 'writers'
                        | 'publishers_spotlight'
                        | 'bestsellers_showcase'
                        | 'trust_features'
                        | 'reading_benefits'
                        | 'off';
                      await updateSettings({
                        showHomeWritersSection: val !== 'off',
                        homeWritersSlotReplacement: val,
                      });
                      setToast({
                        show: true,
                        type: 'success',
                        message:
                          val === 'off'
                            ? 'Homepage Writer section hidden (Off)'
                            : `Homepage Writer slot updated to: ${val.replace('_', ' ')}`,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-[#F8FAFC] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="writers">
                      ✍️ Show Featured Writers / Authors Carousel (Default)
                    </option>
                    <option value="publishers_spotlight">
                      🏛️ Replace with: Official Publications & Partner Houses
                    </option>
                    <option value="bestsellers_showcase">
                      🔥 Replace with: Reader Favorites & Top Bestselling Books
                    </option>
                    <option value="trust_features">
                      🛡️ Replace with: Store Trust & Fast Delivery Guarantees
                    </option>
                    <option value="reading_benefits">
                      📖 Replace with: Look Inside Book Preview & Reader Perks Banner
                    </option>
                    <option value="off">🚫 Turn Off (Keep Homepage Writer Slot Empty)</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Keep Featured Writers active on the Customer Homepage, replace that space with another store feature, or turn it off completely.
                  </p>
                </div>

                {/* 2. Product Card Writer Line Slot (Below Book Title on Cards) */}
                <div className="p-3.5 rounded-2xl bg-white border border-neutral-200/90 space-y-2">
                  <label className="block text-[11px] font-black uppercase text-neutral-900">
                    2. Product Card Writer Slot (Below Book Title on Cards)
                  </label>
                  <select
                    data-testid="product-card-writer-slot-select"
                    value={settings.productCardWriterSlotMode || 'writer_name'}
                    onChange={async e => {
                      const val = e.target.value as
                        | 'writer_name'
                        | 'publisher_name'
                        | 'category_name'
                        | 'edition_info'
                        | 'delivery_badge'
                        | 'off';
                      await updateSettings({ productCardWriterSlotMode: val });
                      setToast({
                        show: true,
                        type: 'success',
                        message: 'Product card writer line updated!',
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 bg-[#F8FAFC] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="writer_name">
                      ✍️ Show Writer / Author Name (Default, e.g. Arif Azad)
                    </option>
                    <option value="publisher_name">
                      🏛️ Replace with: Publisher Name (e.g. Guardian Publications)
                    </option>
                    <option value="category_name">
                      📚 Replace with: Book Category Name (e.g. Islamic Books)
                    </option>
                    <option value="edition_info">
                      📖 Replace with: Edition & Original Print Badge
                    </option>
                    <option value="delivery_badge">
                      🚚 Replace with: "✓ Fast Cash on Delivery" Tag
                    </option>
                    <option value="off">🚫 Turn Off (Hide Writer Line on Product Cards)</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Control whether book cards on the Homepage show the Writer name, replace that line with Publisher/Category/Edition info, or turn it off.
                  </p>
                </div>
              </div>
            </div>

            {/* Authors Responsive Grid: 1 col mobile, 2 col tablet, 3 col laptop, 4 col PC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {authors
                .filter(author => !authorSearchQuery.trim() || author.name.toLowerCase().includes(authorSearchQuery.toLowerCase()))
                .map(author => (
                <div key={author.id} className="p-3.5 rounded-xl border border-neutral-200/90 bg-white hover:border-neutral-300 transition-all flex flex-col justify-between gap-3 shadow-2xs group">
                  <div className="flex items-center gap-3">
                    {/* Author Profile Picture */}
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-neutral-200 bg-[#FFF1F2] flex items-center justify-center">
                      {author.photoUrl ? (
                        <img 
                          src={author.photoUrl} 
                          alt={author.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-[#D71920] font-black text-base">{author.name[0]}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-neutral-900 truncate">{author.name}</h4>
                      <p className="text-[11px] font-semibold text-neutral-500 mt-0.5">
                        {author.booksCount || 10}+ Books Published
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2.5 border-t border-neutral-100">
                    <button 
                      onClick={() => {
                        setEditingAuthorId(author.id);
                        setAuthorName(author.name);
                        setAuthorBio(author.bio || '');
                        setAuthorPhoto(author.photoUrl || '');
                        setAuthorBooksCount(author.booksCount || 20);
                        setShowAddAuthorModal(true);
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 size={11} /> <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => deleteAuthor(author.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-red-50/70 hover:bg-red-100 text-red-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Delete Author"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Author Modal */}
            {showAddAuthorModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E5] space-y-5 my-8">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
                    <h3 className="text-lg font-black text-[#171717]">
                      {editingAuthorId ? 'Edit Author Profile' : 'Add New Author'}
                    </h3>
                    <button 
                      onClick={() => setShowAddAuthorModal(false)}
                      className="text-[#777777] hover:text-[#171717] text-lg font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveAuthor} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">Author Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Humayun Ahmed"
                        value={authorName} 
                        onChange={e => setAuthorName(e.target.value)} 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      />
                    </div>

                    {/* Author Photo Upload & URL */}
                    <div>
                      <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">
                        Author Profile Picture (URL or Upload from Device)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="url" 
                          placeholder="https://example.com/author.jpg"
                          value={authorPhoto} 
                          onChange={e => setAuthorPhoto(e.target.value)} 
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                        <label className="px-4 py-2.5 bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#D71920] hover:text-white transition-colors">
                          <Upload size={14} /> Upload
                          <input type="file" accept="image/*" onChange={handleAuthorFileUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Photo Preview & Presets */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D71920]/30 bg-neutral-100 shrink-0 flex items-center justify-center">
                          {authorPhoto ? (
                            <img src={authorPhoto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#D71920] font-bold text-sm">Preview</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-[#5F6368] font-bold mb-1">Preset Writer Portraits:</div>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { name: 'Humayun Ahmed', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80' },
                              { name: 'Zafar Iqbal', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
                              { name: 'Sarat Chandra', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
                              { name: 'Arif Azad', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80' }
                            ].map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setAuthorPhoto(preset.url)}
                                className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-[#FFF1F2] hover:text-[#D71920] border border-[#E5E5E5] font-semibold cursor-pointer"
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">Books Count</label>
                        <input 
                          type="number" 
                          min="1"
                          value={authorBooksCount} 
                          onChange={e => setAuthorBooksCount(Number(e.target.value))} 
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[#171717] mb-1 uppercase tracking-wider text-[11px]">Author Biography</label>
                      <textarea 
                        rows={3}
                        placeholder="Short summary of literary contributions..."
                        value={authorBio} 
                        onChange={e => setAuthorBio(e.target.value)} 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEEEEE]">
                      <button 
                        type="button" 
                        onClick={() => setShowAddAuthorModal(false)}
                        className="px-5 py-2.5 bg-neutral-100 text-[#171717] font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} /> Save Author Profile
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: PUBLISHERS MANAGEMENT */}
        {activeTab === 'publishers' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">
                    Publishers Directory ({publishers.length})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Add and manage publishers like categories — book counts update automatically when books are assigned
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search publishers..."
                    value={publisherSearchQuery}
                    onChange={e => setPublisherSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 focus:bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingPublisherId(null);
                    setPubName('');
                    setPubBanglaName('');
                    setPubLogo('');
                    setPubBooksCount(0);
                    setPubDescription('');
                    setPubEstYear('');
                    setShowAddPublisherModal(true);
                  }}
                  className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus size={14} /> <span>Add Publisher</span>
                </button>
              </div>
            </div>

            {publishers.length === 0 ? (
              <div className="bg-neutral-50/70 border border-dashed border-neutral-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center mx-auto">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900">No Custom Publishers Saved Yet</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                    Import default Bangladeshi publishing houses or add a custom publisher profile.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={async () => {
                      for (const defPub of DEFAULT_PUBLISHERS_LIST) {
                        const liveMatches = countBooksForPublisher(defPub, products);
                        await addPublisher({
                          id: defPub.id || 'pub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                          name: defPub.name,
                          banglaName: defPub.banglaName,
                          logoUrl: defPub.logoUrl,
                          booksCount: liveMatches,
                          description: defPub.description,
                          establishedYear: defPub.establishedYear,
                          isFeatured: true,
                        });
                      }
                      setToast({ show: true, type: 'success', message: 'Default publishers imported to Firebase!' });
                    }}
                    className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Import Defaults ({DEFAULT_PUBLISHERS_LIST.length})
                  </button>
                  <button
                    onClick={() => {
                      setEditingPublisherId(null);
                      setPubName('');
                      setPubBanglaName('');
                      setPubLogo('');
                      setPubBooksCount(0);
                      setPubDescription('');
                      setPubEstYear('');
                      setShowAddPublisherModal(true);
                    }}
                    className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add First Publisher
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {publishers
                  .filter(pub => {
                    if (!publisherSearchQuery.trim()) return true;
                    const q = publisherSearchQuery.toLowerCase();
                    return pub.name.toLowerCase().includes(q) || (pub.banglaName || '').toLowerCase().includes(q);
                  })
                  .map(pub => {
                  const catalogMatches = countBooksForPublisher(pub, products);
                  return (
                    <div key={pub.id} className="bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-2xs transition-all">
                      <div className="flex items-start gap-3">
                        <img
                          src={pub.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(pub.name)}&background=FFF0F0&color=D71920&bold=true&size=200`}
                          alt={pub.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-200 bg-[#FFF5F5]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="font-bold text-neutral-900 text-sm truncate">
                              {pub.banglaName || pub.name}
                            </h3>
                            {pub.establishedYear && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 shrink-0">
                                {pub.establishedYear}
                              </span>
                            )}
                          </div>
                          {pub.banglaName && (
                            <p className="text-[11px] text-neutral-500 truncate">{pub.name}</p>
                          )}
                          <p className="text-[11px] text-[#D71920] font-bold mt-1">
                            {catalogMatches} {catalogMatches === 1 ? 'Book' : 'Books'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2.5 border-t border-neutral-100">
                        <button
                          onClick={() => {
                            setEditingPublisherId(pub.id);
                            setPubName(pub.name);
                            setPubBanglaName(pub.banglaName || '');
                            setPubLogo(pub.logoUrl || '');
                            setPubBooksCount(catalogMatches);
                            setPubDescription(pub.description || '');
                            setPubEstYear(pub.establishedYear || '');
                            setShowAddPublisherModal(true);
                          }}
                          className="flex-1 py-1.5 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={11} /> <span>Edit</span>
                        </button>
                        <button
                          onClick={async () => {
                            await deletePublisher(pub.id);
                            setToast({ show: true, type: 'success', message: 'Publisher deleted.' });
                          }}
                          className="py-1.5 px-2.5 bg-red-50/70 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Delete Publisher"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add / Edit Publisher Modal */}
            {showAddPublisherModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white border border-[#E5E5E5] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
                  <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-4">
                    <h3 className="text-lg font-black text-[#171717] flex items-center gap-2">
                      <Building2 size={18} className="text-[#D71920]" />
                      {editingPublisherId ? 'Edit Publisher' : 'Add New Publisher'}
                    </h3>
                    <button
                      onClick={() => setShowAddPublisherModal(false)}
                      className="p-2 rounded-lg text-[#5F6368] hover:bg-neutral-100 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSavePublisher} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#5F6368] mb-1">
                          Publisher Name (English) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Guardian Publications"
                          value={pubName}
                          onChange={e => setPubName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#5F6368] mb-1">
                          Bangla Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. গার্ডিয়ান পাবলিকেশন্স"
                          value={pubBanglaName}
                          onChange={e => setPubBanglaName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5F6368] mb-1">
                        Publisher Logo (Upload or URL)
                      </label>
                      <div className="flex items-center gap-3">
                        {pubLogo && (
                          <img
                            src={pubLogo}
                            alt="Logo preview"
                            className="w-12 h-12 rounded-xl object-cover border border-[#E5E5E5] shrink-0"
                          />
                        )}
                        <input
                          type="text"
                          placeholder="https://... or upload image"
                          value={pubLogo}
                          onChange={e => setPubLogo(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] text-xs"
                        />
                        <label className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-bold rounded-xl cursor-pointer shrink-0 flex items-center gap-1.5">
                          <Upload size={14} /> Upload
                          <input type="file" accept="image/*" onChange={handlePublisherFileUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#5F6368] mb-1">
                          Total Books (Auto-Counted)
                        </label>
                        <div className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-neutral-100/80 text-[#171717] text-xs font-extrabold flex items-center justify-between">
                          <span>
                            {countBooksForPublisher({ name: pubName, banglaName: pubBanglaName }, products)}{' '}
                            {countBooksForPublisher({ name: pubName, banglaName: pubBanglaName }, products) === 1 ? 'Book' : 'Books'} in Catalog
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920]">
                            Auto
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#5F6368] mb-1">
                          Established Year (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2015"
                          value={pubEstYear}
                          onChange={e => setPubEstYear(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#5F6368] mb-1">
                        Short Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Brief description of the publishing house..."
                        value={pubDescription}
                        onChange={e => setPubDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-[#EEEEEE]">
                      <button
                        type="button"
                        onClick={() => setShowAddPublisherModal(false)}
                        className="px-5 py-2.5 bg-neutral-100 text-[#171717] font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} /> Save Publisher
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: SUBSCRIBERS AUDIENCE MANAGEMENT */}
        {activeTab === 'subscribers' && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
            {/* Minimal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900">
                    VIP Club & Discount Subscribers
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Phone numbers and emails collected from the storefront newsletter & discount club
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (subscribers.length === 0) {
                      alert('No subscribers to copy.');
                      return;
                    }
                    const list = subscribers.map(s => s.emailOrPhone).join('\n');
                    navigator.clipboard?.writeText(list);
                    setCopiedSubs(true);
                    setTimeout(() => setCopiedSubs(false), 2500);
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedSubs ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedSubs ? 'Copied!' : 'Copy All'}</span>
                </button>

                <button
                  onClick={() => {
                    setNewSubInput('');
                    setNewSubMsg(null);
                    setShowAddSubModal(true);
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Subscriber</span>
                </button>
              </div>
            </div>

            {/* Compact 3-Column Metric Bar */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <div className="bg-neutral-50/80 p-3 sm:p-4 rounded-xl border border-neutral-200/80">
                <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider block truncate">Total Audience</span>
                <div className="text-lg sm:text-2xl font-black text-neutral-900 mt-0.5">{subscribers.length}</div>
              </div>

              <div className="bg-neutral-50/80 p-3 sm:p-4 rounded-xl border border-neutral-200/80">
                <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider block truncate">Mobile Numbers</span>
                <div className="text-lg sm:text-2xl font-black text-[#D71920] mt-0.5">
                  {subscribers.filter(s => s.type === 'phone').length}
                </div>
              </div>

              <div className="bg-neutral-50/80 p-3 sm:p-4 rounded-xl border border-neutral-200/80">
                <span className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider block truncate">Email Addresses</span>
                <div className="text-lg sm:text-2xl font-black text-blue-600 mt-0.5">
                  {subscribers.filter(s => s.type === 'email').length}
                </div>
              </div>
            </div>

            {/* Search & Count Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by phone number or email..."
                  value={subSearchQuery}
                  onChange={e => setSubSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50/70 focus:bg-white text-xs font-semibold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <span className="text-xs font-semibold text-neutral-500">
                Showing {subscribers.filter(s => {
                  if (!subSearchQuery.trim()) return true;
                  return s.emailOrPhone.toLowerCase().includes(subSearchQuery.toLowerCase());
                }).length} of {subscribers.length} subscribers
              </span>
            </div>

            {/* Subscribers Grid (1 col mobile, 2 cols desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {subscribers
                .filter(s => {
                  if (!subSearchQuery.trim()) return true;
                  return s.emailOrPhone.toLowerCase().includes(subSearchQuery.toLowerCase());
                })
                .sort((a, b) => b.subscribedAt - a.subscribedAt)
                .map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-neutral-200/90 hover:border-neutral-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        sub.type === 'phone' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/70' 
                          : 'bg-blue-50 text-blue-600 border border-blue-200/70'
                      }`}>
                        {sub.type === 'phone' ? '📱' : <Mail size={14} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900 truncate">
                            {sub.emailOrPhone}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            sub.type === 'phone' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {sub.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {new Date(sub.subscribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(sub.emailOrPhone);
                          setToast({ show: true, type: 'success', message: `Copied ${sub.emailOrPhone}` });
                        }}
                        className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer transition-colors"
                        title="Copy"
                      >
                        <Copy size={12} />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Remove subscriber ${sub.emailOrPhone}?`)) {
                            await deleteSubscriber(sub.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-50/70 hover:bg-red-100 text-red-600 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

              {subscribers.length === 0 && (
                <div className="col-span-full text-center py-10 bg-neutral-50/70 rounded-xl border border-dashed border-neutral-200">
                  <Mail size={26} className="mx-auto text-neutral-300 mb-1.5" />
                  <p className="font-bold text-neutral-700 text-xs">No subscribers recorded yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Visitors subscribing from the website footer will appear here automatically
                  </p>
                </div>
              )}
            </div>

            {/* Add Subscriber Modal */}
            {showAddSubModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <h3 className="font-black text-neutral-900 text-base">Add New VIP Subscriber</h3>
                    <button
                      onClick={() => setShowAddSubModal(false)}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newSubInput.trim()) return;
                      const res = await addSubscriber(newSubInput.trim());
                      setNewSubMsg({ text: res.message, success: res.success });
                      if (res.success) {
                        setTimeout(() => {
                          setShowAddSubModal(false);
                          setNewSubInput('');
                          setNewSubMsg(null);
                        }, 1200);
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wider text-[10px]">
                        Subscriber Email or Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="01712345678 or customer@example.com"
                        value={newSubInput}
                        onChange={e => setNewSubInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-900 font-bold focus:outline-none focus:border-[#D71920]"
                      />
                    </div>

                    {newSubMsg && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold ${
                        newSubMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {newSubMsg.text}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                      <button
                        type="button"
                        onClick={() => setShowAddSubModal(false)}
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                      >
                        Save Subscriber
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: STORE SETTINGS (SEPARATED SUB-TABS: HEADER, FOOTER, PAYMENT & SHIPPING, SOCIAL, SEO) */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Compact Top Settings Navigation Bar (Following Reference Layout in Website Brand Theme) */}
            <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
              {/* Top Action Row: Title + Live Sync Badge + Sync / Clear / Reset / Save Buttons */}
              <div className="px-4 sm:px-5 py-3 border-b border-[#EEEEEE] flex flex-wrap items-center justify-between gap-2.5 bg-[#FAFAFA]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF1F2] border border-[#D71920]/20 text-[#D71920] flex items-center justify-center shrink-0">
                    <Settings size={16} />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-[#171717] tracking-tight">Settings</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Sync
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Sync Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsForm(settings);
                      setToast({ show: true, type: 'success', message: 'Synced latest settings from Firebase!' });
                    }}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F8] text-[#171717] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reload current saved settings from Firebase"
                  >
                    <RefreshCw size={12} className="text-[#5F6368]" />
                    <span>Sync</span>
                  </button>

                  {/* Clear Button (Contextual to active sub-tab) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (settingsSubTab === 'header') {
                        setSettingsForm(prev => ({ ...prev, logoUrl: '', faviconUrl: '', storeName: '', tagline: '' }));
                      } else if (settingsSubTab === 'footer') {
                        setSettingsForm(prev => ({ ...prev, footerLogoUrl: '', footerBrandName: '', footerPaymentBannerUrl: '', footerDescription: '' }));
                      } else if (settingsSubTab === 'social') {
                        setSettingsForm(prev => ({ ...prev, socialLinks: [] }));
                      } else if (settingsSubTab === 'seo') {
                        setSettingsForm(prev => ({ ...prev, metaTitle: '', metaDescription: '', ogImageUrl: '', keywords: '' }));
                      }
                      setToast({ show: true, type: 'success', message: 'Cleared fields in current section. Click Save to apply.' });
                    }}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-red-200 bg-[#FFF1F2]/60 hover:bg-[#FFF1F2] text-[#D71920] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Clear fields in current tab"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>

                  {/* Reset Defaults Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsForm(prev => ({
                        ...prev,
                        storeName: 'MR. BOOKS',
                        tagline: 'Bookstore & Stationery',
                        logoUrl: '',
                        showHeaderIcon: true,
                        headerNameColor1: '#171717',
                        headerNameColor2: '#D71920',
                        footerLogoUrl: '',
                        showFooterIcon: true,
                        footerBrandName: 'MR. BOOKS',
                        footerNameColor1: '#FFFFFF',
                        footerNameColor2: '#D71920',
                        footerBgColor: '#121212',
                        footerCardBgColor: '#1c1c1e',
                        footerPaymentBannerUrl: ''
                      }));
                      setToast({ show: true, type: 'success', message: 'Restored default brand & color settings. Click Save to apply.' });
                    }}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/70 text-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset brand colors & defaults"
                  >
                    <RefreshCw size={12} />
                    <span>Reset</span>
                  </button>

                  {/* Save Button */}
                  <button
                    type="button"
                    disabled={settingsSaving}
                    onClick={async () => {
                      setSettingsSaving(true);
                      try {
                        await updateSettings(settingsForm);
                        setSettingsSuccess(true);
                        setToast({ show: true, type: 'success', message: 'Settings saved to Firebase & updated live!' });
                        setTimeout(() => setSettingsSuccess(false), 3000);
                      } finally {
                        setSettingsSaving(false);
                      }
                    }}
                    className="px-3.5 sm:px-4 py-1.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl text-[11px] sm:text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Check size={13} />
                    <span>{settingsSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Bottom Sub-Tab Selector Grid (1. Header & Logo, 2. Footer & Links, 3. Payment & Shipping, 4. Social Media, 5. SEO & Support, 6. Home Page Settings) */}
              <div className="p-2 sm:p-2.5 bg-white grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
                {[
                  {
                    id: 'header' as const,
                    num: '1. Header & Logo',
                    sub: 'Logo, Name, Colors, Favicon & Notice',
                    icon: BookOpen
                  },
                  {
                    id: 'footer' as const,
                    num: '2. Footer & Links',
                    sub: 'Footer Logo, Color, Payment & Text',
                    icon: Layers
                  },
                  {
                    id: 'shipping' as const,
                    num: '3. Payment & Shipping',
                    sub: 'COD, Dhaka/Outside & Courier Rates',
                    icon: Truck
                  },
                  {
                    id: 'social' as const,
                    num: '4. Social Media',
                    sub: 'Facebook, Instagram, WhatsApp & Support',
                    icon: Users
                  },
                  {
                    id: 'seo' as const,
                    num: '5. SEO & Marketing',
                    sub: 'Meta Tags, Pixel, CAPI & Analytics',
                    icon: Sparkles
                  },
                  {
                    id: 'homepage' as const,
                    num: '6. Home Page Settings',
                    sub: 'Reviews & Authors Toggles (homeConfig)',
                    icon: Eye
                  }
                ].map(tab => {
                  const IconComp = tab.icon;
                  const isActive = settingsSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSettingsSubTab(tab.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#D71920] border-[#D71920] text-white shadow-xs'
                          : 'bg-[#F7F7F8] hover:bg-[#FFF1F2]/60 border-[#E5E5E5] hover:border-[#D71920]/30 text-[#171717]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-[#D71920] border border-[#E5E5E5]'
                        }`}
                      >
                        <IconComp size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-[#171717]'}`}>
                          {tab.num}
                        </div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-white/85' : 'text-[#5F6368]'}`}>
                          {tab.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===================================================================== */}
            {/* HOME PAGE SETTINGS SECTION (`homeConfig` Document in Firebase)        */}
            {/* ===================================================================== */}
            <div
              data-testid="admin-home-page-settings-section"
              className="bg-white border border-[#E5E5E5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEEE]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Settings size={17} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-[#171717]">
                        Home Page Settings
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Firebase: homeConfig
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6368] mt-0.5">
                      Toggle individual Home Page components ON or OFF in real time. Changes immediately update the <code className="font-mono font-bold text-[#171717]">homeConfig</code> document in Firebase and conditionally render sections on the customer Home page.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                      homeConfig.showReviews !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    Reviews: {homeConfig.showReviews !== false ? 'ON' : 'OFF'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                      homeConfig.showAuthors !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    Authors: {homeConfig.showAuthors !== false ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle Card 1: Reviews Component */}
                <div
                  data-testid="home-config-reviews-card"
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    homeConfig.showReviews !== false
                      ? 'bg-emerald-50/40 border-emerald-200/90'
                      : 'bg-[#F8FAFC] border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          homeConfig.showReviews !== false
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        {renderGreenReviewIcon(
                          homeConfig.reviewIconStyle || settings.homeReviewIconStyle,
                          16
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-[#171717]">
                            Reviews Component
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              homeConfig.showReviews !== false
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {homeConfig.showReviews !== false ? 'Visible on Home' : 'Hidden on Home'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5F6368] mt-0.5">
                          Controls Customer Reviews & Green Rating section on the Home page (<code className="font-mono">homeConfig.showReviews</code>).
                        </p>
                      </div>
                    </div>

                    {/* Individual Toggle Switch for Reviews */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={homeConfig.showReviews !== false}
                      aria-label="Toggle Reviews component on Home page"
                      data-testid="home-config-reviews-toggle"
                      onClick={async () => {
                        const nextShow = !(homeConfig.showReviews !== false);
                        await updateHomeConfig({
                          showReviews: nextShow,
                          reviewsSlotReplacement: nextShow
                            ? homeConfig.reviewsSlotReplacement === 'off'
                              ? 'reviews'
                              : homeConfig.reviewsSlotReplacement || 'reviews'
                            : 'off',
                        });
                        setToast({
                          show: true,
                          type: 'success',
                          message: `Home Page 'Reviews' component turned ${nextShow ? 'ON' : 'OFF'} in Firebase homeConfig!`,
                        });
                      }}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        homeConfig.showReviews !== false ? 'bg-emerald-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          homeConfig.showReviews !== false ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Optional Slot Mode & Green Icon Selector when Reviews is ON */}
                  <div className="pt-2.5 border-t border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                        Reviews Slot Mode
                      </label>
                      <select
                        data-testid="home-config-reviews-slot-select"
                        value={
                          homeConfig.showReviews === false
                            ? 'off'
                            : homeConfig.reviewsSlotReplacement || 'reviews'
                        }
                        onChange={async e => {
                          const val = e.target.value as
                            | 'reviews'
                            | 'trust_features'
                            | 'publishers_spotlight'
                            | 'reading_benefits'
                            | 'off';
                          await updateHomeConfig({
                            showReviews: val !== 'off',
                            reviewsSlotReplacement: val,
                          });
                          setToast({
                            show: true,
                            type: 'success',
                            message: `Updated homeConfig Reviews slot to: ${val}`,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                      >
                        <option value="reviews">💚 Customer Reviews Carousel</option>
                        <option value="trust_features">🛡️ Store Trust Guarantees</option>
                        <option value="publishers_spotlight">🏛️ Official Publications</option>
                        <option value="reading_benefits">📖 Reader Perks Banner</option>
                        <option value="off">🚫 Off (Hidden)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                        Green Review Icon (💚)
                      </label>
                      <select
                        data-testid="home-config-reviews-icon-select"
                        value={homeConfig.reviewIconStyle || settings.homeReviewIconStyle || 'heart'}
                        onChange={async e => {
                          const style = e.target.value as
                            | 'heart'
                            | 'verified_shield'
                            | 'thumbs_up'
                            | 'check_badge'
                            | 'sparkles'
                            | 'book_love';
                          await updateHomeConfig({ reviewIconStyle: style });
                          setToast({
                            show: true,
                            type: 'success',
                            message: `Updated green review icon to: ${style}`,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                      >
                        <option value="heart">💚 Green Heart</option>
                        <option value="verified_shield">🛡️ Trust Shield</option>
                        <option value="thumbs_up">👍 Thumbs Up</option>
                        <option value="check_badge">✅ Check Badge</option>
                        <option value="sparkles">✨ Sparkles</option>
                        <option value="book_love">📖 Book Icon</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Toggle Card 2: Authors Component */}
                <div
                  data-testid="home-config-authors-card"
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    homeConfig.showAuthors !== false
                      ? 'bg-emerald-50/40 border-emerald-200/90'
                      : 'bg-[#F8FAFC] border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          homeConfig.showAuthors !== false
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-200 text-neutral-600'
                        }`}
                      >
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-[#171717]">
                            Authors Component
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              homeConfig.showAuthors !== false
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {homeConfig.showAuthors !== false ? 'Visible on Home' : 'Hidden on Home'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5F6368] mt-0.5">
                          Controls Featured Authors / Writers section on the Home page (<code className="font-mono">homeConfig.showAuthors</code>).
                        </p>
                      </div>
                    </div>

                    {/* Individual Toggle Switch for Authors */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={homeConfig.showAuthors !== false}
                      aria-label="Toggle Authors component on Home page"
                      data-testid="home-config-authors-toggle"
                      onClick={async () => {
                        const nextShow = !(homeConfig.showAuthors !== false);
                        await updateHomeConfig({
                          showAuthors: nextShow,
                          authorsSlotReplacement: nextShow
                            ? homeConfig.authorsSlotReplacement === 'off'
                              ? 'writers'
                              : homeConfig.authorsSlotReplacement || 'writers'
                            : 'off',
                        });
                        setToast({
                          show: true,
                          type: 'success',
                          message: `Home Page 'Authors' component turned ${nextShow ? 'ON' : 'OFF'} in Firebase homeConfig!`,
                        });
                      }}
                      className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        homeConfig.showAuthors !== false ? 'bg-emerald-600' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          homeConfig.showAuthors !== false ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Optional Slot Mode & Product Card Writer Line Selector */}
                  <div className="pt-2.5 border-t border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                        Authors Slot Mode
                      </label>
                      <select
                        data-testid="home-config-authors-slot-select"
                        value={
                          homeConfig.showAuthors === false
                            ? 'off'
                            : homeConfig.authorsSlotReplacement || 'writers'
                        }
                        onChange={async e => {
                          const val = e.target.value as
                            | 'writers'
                            | 'publishers_spotlight'
                            | 'bestsellers_showcase'
                            | 'trust_features'
                            | 'reading_benefits'
                            | 'off';
                          await updateHomeConfig({
                            showAuthors: val !== 'off',
                            authorsSlotReplacement: val,
                          });
                          setToast({
                            show: true,
                            type: 'success',
                            message: `Updated homeConfig Authors slot to: ${val}`,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                      >
                        <option value="writers">✍️ Featured Authors Carousel</option>
                        <option value="publishers_spotlight">🏛️ Official Publications</option>
                        <option value="bestsellers_showcase">🔥 Bestsellers Showcase</option>
                        <option value="trust_features">🛡️ Store Trust Guarantees</option>
                        <option value="reading_benefits">📖 Reader Perks Banner</option>
                        <option value="off">🚫 Off (Hidden)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                        Book Card Writer Line
                      </label>
                      <select
                        data-testid="home-config-card-writer-select"
                        value={homeConfig.productCardWriterSlotMode || settings.productCardWriterSlotMode || 'writer_name'}
                        onChange={async e => {
                          const mode = e.target.value as
                            | 'writer_name'
                            | 'publisher_name'
                            | 'category_name'
                            | 'edition_info'
                            | 'delivery_badge'
                            | 'off';
                          await updateHomeConfig({ productCardWriterSlotMode: mode });
                          setToast({
                            show: true,
                            type: 'success',
                            message: `Updated book card writer slot to: ${mode}`,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                      >
                        <option value="writer_name">✍️ Show Writer Name</option>
                        <option value="publisher_name">🏛️ Show Publisher Name</option>
                        <option value="category_name">📚 Show Category Name</option>
                        <option value="edition_info">📖 Show Edition Badge</option>
                        <option value="delivery_badge">🚚 Fast COD Badge</option>
                        <option value="off">🚫 Hide Writer Line</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {settingsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Settings saved to Firebase and updated in real-time across Header, Favicon & Footer!</span>
              </div>
            )}

            {/* Main Settings Form Container */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSettingsSaving(true);
                try {
                  await updateSettings(settingsForm);
                  setSettingsSuccess(true);
                  setToast({ show: true, type: 'success', message: 'Store settings saved to Firebase!' });
                  setTimeout(() => setSettingsSuccess(false), 3000);
                } finally {
                  setSettingsSaving(false);
                }
              }}
              className="bg-white border border-[#E5E5E5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-5"
            >
              {/* ===================================================================== */}
              {/* SUB-TAB 1: HEADER & LOGO (Logo, Store Name, Colors, Favicon, Notice) */}
              {/* ===================================================================== */}
              {settingsSubTab === 'header' && (
                <div className="space-y-4">
                  {/* Live Header Brand Preview Box */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#D71920] block">
                        Live Header Brand Preview
                      </span>
                      <p className="text-[11px] text-[#5F6368]">
                        Upload a Logo OR type a Store Name below. If you clear the Store Name, the default icon also disappears automatically.
                      </p>
                    </div>

                    {/* Simulated Header Preview Pill */}
                    <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center gap-2.5 self-start sm:self-auto">
                      {(() => {
                        const hasLogo = isValidImageUrl(settingsForm.logoUrl);
                        const rawName = (settingsForm.storeName ?? '').trim();
                        const hasName = rawName.length > 0;
                        const showIcon = !hasLogo && hasName && settingsForm.showHeaderIcon !== false;
                        const c1 = settingsForm.headerNameColor1 || '#171717';
                        const c2 = settingsForm.headerNameColor2 || '#D71920';

                        if (!hasLogo && !hasName) {
                          return <span className="text-xs italic text-neutral-400">No Logo or Name (Empty)</span>;
                        }

                        return (
                          <>
                            {hasLogo && (
                              <img
                                src={settingsForm.logoUrl}
                                alt="Logo Preview"
                                onError={() => setSettingsForm(prev => ({ ...prev, logoUrl: '' }))}
                                className="h-8 w-auto max-w-[120px] object-contain rounded"
                              />
                            )}
                            {showIcon && (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                                style={{ backgroundColor: c2 }}
                              >
                                <BookOpen size={16} />
                              </div>
                            )}
                            {hasName && (
                              <div className="leading-tight">
                                <div className="text-base font-black tracking-tight">
                                  {(() => {
                                    const parts = rawName.split(/\s+/);
                                    if (parts.length <= 1) return <span style={{ color: c1 }}>{rawName}</span>;
                                    const last = parts[parts.length - 1];
                                    const first = parts.slice(0, -1).join(' ');
                                    return (
                                      <>
                                        <span style={{ color: c1 }}>{first}</span>{' '}
                                        <span style={{ color: c2 }}>{last}</span>
                                      </>
                                    );
                                  })()}
                                </div>
                                {settingsForm.showHeaderTagline !== false && settingsForm.tagline && (
                                  <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500">
                                    {settingsForm.tagline}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Row 1: Header Brand Logo Upload + Website Favicon Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Header Logo Upload Card */}
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-neutral-900 block">1. Header Brand Logo (Optional)</span>
                          <span className="text-[11px] text-neutral-500">Upload a custom logo image for the top header</span>
                        </div>
                        {isValidImageUrl(settingsForm.logoUrl) && (
                          <button
                            type="button"
                            onClick={async () => {
                              setSettingsForm(prev => ({ ...prev, logoUrl: '' }));
                              await updateSettings({ logoUrl: '' });
                              setToast({ show: true, type: 'success', message: 'Header logo removed!' });
                            }}
                            className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {isValidImageUrl(settingsForm.logoUrl) ? (
                            <img
                              src={settingsForm.logoUrl}
                              alt="Header Logo Preview"
                              onError={() => setSettingsForm(prev => ({ ...prev, logoUrl: '' }))}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-neutral-400">No Logo</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors">
                              <Upload size={12} />
                              <span>Upload Logo</span>
                              <input
                                type="file"
                                accept="image/*,.svg,.ico"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  try {
                                    const dataUrl = await compressImageFile(file, 400, 400, 0.9);
                                    setSettingsForm(prev => ({ ...prev, logoUrl: dataUrl }));
                                    await updateSettings({ logoUrl: dataUrl });
                                    setToast({ show: true, type: 'success', message: 'Header logo uploaded & saved in real-time!' });
                                  } catch (err: any) {
                                    console.error('Logo upload error:', err);
                                    setToast({ show: true, type: 'error', message: err?.message || 'Failed to upload logo' });
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[10px] text-neutral-500">PNG, SVG, JPG</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Or paste Header Logo URL (https://...)"
                            value={isValidImageUrl(settingsForm.logoUrl) ? settingsForm.logoUrl : ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, logoUrl: sanitizeImageUrl(e.target.value) }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Website Favicon Upload Card (Right Inside Header Section!) */}
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-neutral-900 block">2. Website Favicon (Browser Tab Icon)</span>
                          <span className="text-[11px] text-neutral-500">Add or change your website's browser tab icon</span>
                        </div>
                        {isValidImageUrl(settingsForm.faviconUrl) && (
                          <button
                            type="button"
                            onClick={async () => {
                              setSettingsForm(prev => ({ ...prev, faviconUrl: '' }));
                              await updateSettings({ faviconUrl: '' });
                              setToast({ show: true, type: 'success', message: 'Favicon removed!' });
                            }}
                            className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Remove Favicon
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {isValidImageUrl(settingsForm.faviconUrl) ? (
                            <img
                              src={settingsForm.faviconUrl}
                              alt="Favicon Preview"
                              onError={() => setSettingsForm(prev => ({ ...prev, faviconUrl: '' }))}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 text-[10px] font-black">
                              ICO
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-[#171717] hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors">
                              <Upload size={12} />
                              <span>Upload Favicon</span>
                              <input
                                type="file"
                                accept="image/*,.ico,.svg"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  try {
                                    const dataUrl = await compressImageFile(file, 128, 128, 0.92);
                                    setSettingsForm(prev => ({ ...prev, faviconUrl: dataUrl }));
                                    await updateSettings({ faviconUrl: dataUrl });
                                    setToast({ show: true, type: 'success', message: 'Favicon uploaded & updated in browser tab!' });
                                  } catch (err: any) {
                                    console.error('Favicon upload error:', err);
                                    setToast({ show: true, type: 'error', message: err?.message || 'Failed to upload favicon' });
                                  }
                                }}
                              />
                            </label>
                            <span className="text-[10px] text-neutral-500">Square PNG / ICO / SVG</span>
                          </div>
                          <input
                            type="text"
                            placeholder="Or paste Favicon Image URL (https://...)"
                            value={isValidImageUrl(settingsForm.faviconUrl) ? settingsForm.faviconUrl : ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, faviconUrl: sanitizeImageUrl(e.target.value) }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Store Name + First/Second Word Color Pickers + Book Icon Toggle */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                      <div>
                        <span className="font-black text-neutral-900 block">3. Header Store Name, Colors & Optional Icon</span>
                        <span className="text-[11px] text-neutral-500">
                          Customize the 1st & 2nd word colors. Clearing the Store Name automatically removes the icon too.
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                        !(settingsForm.storeName || '').trim() || settingsForm.logoUrl
                          ? 'opacity-50 bg-neutral-100 border-neutral-200 text-neutral-400'
                          : 'bg-white border-neutral-300 text-neutral-800'
                      }`}>
                        <input
                          type="checkbox"
                          checked={Boolean((settingsForm.storeName || '').trim()) && !settingsForm.logoUrl && settingsForm.showHeaderIcon !== false}
                          disabled={!(settingsForm.storeName || '').trim() || Boolean(settingsForm.logoUrl)}
                          onChange={e => setSettingsForm(prev => ({ ...prev, showHeaderIcon: e.target.checked }))}
                          className="w-3.5 h-3.5 accent-[#D71920]"
                        />
                        <span>Show Icon with Name</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      {/* Store Name Input */}
                      <div className="sm:col-span-5">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-[#5F6368] uppercase text-[11px]">Header Store Name</label>
                          {settingsForm.storeName && (
                            <button
                              type="button"
                              onClick={() => setSettingsForm(prev => ({ ...prev, storeName: '' }))}
                              className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                            >
                              Clear Name & Icon
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={settingsForm.storeName ?? ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, storeName: e.target.value }))}
                          placeholder="e.g. MR. BOOKS (Leave empty for Logo only)"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold text-xs"
                        />
                      </div>

                      {/* First Word Color Picker */}
                      <div className="sm:col-span-3">
                        <label className="block font-bold text-[#5F6368] uppercase text-[11px] mb-1">1st Word Color (e.g. MR.)</label>
                        <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2 py-1">
                          <input
                            type="color"
                            value={settingsForm.headerNameColor1 || '#171717'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor1: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.headerNameColor1 || '#171717'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor1: e.target.value }))}
                            className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Second Word Color Picker */}
                      <div className="sm:col-span-4">
                        <label className="block font-bold text-[#5F6368] uppercase text-[11px] mb-1">2nd Word & Icon Color (e.g. BOOKS)</label>
                        <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2 py-1">
                          <input
                            type="color"
                            value={settingsForm.headerNameColor2 || '#D71920'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor2: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.headerNameColor2 || '#D71920'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, headerNameColor2: e.target.value }))}
                            className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            {['#D71920', '#171717', '#0A8754', '#1D63D8'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSettingsForm(prev => ({ ...prev, headerNameColor2: c }))}
                                className="w-4 h-4 rounded-full border border-neutral-300 cursor-pointer"
                                style={{ backgroundColor: c }}
                                title={`Use ${c}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tagline & Contact Phone inside Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/80">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold uppercase text-[#5F6368] text-[11px]">Header Sub-Title / Tagline</label>
                          <label className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.showHeaderTagline !== false}
                              onChange={e => setSettingsForm(prev => ({ ...prev, showHeaderTagline: e.target.checked }))}
                              className="w-3.5 h-3.5 accent-[#D71920]"
                            />
                            <span>Show Tagline</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={settingsForm.tagline || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, tagline: e.target.value }))}
                          placeholder="e.g. Bookstore & Stationery"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold uppercase text-[#5F6368] text-[11px]">Header Hotline / Contact Number</label>
                          <label className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.showHeaderContact !== false}
                              onChange={e => setSettingsForm(prev => ({ ...prev, showHeaderContact: e.target.checked }))}
                              className="w-3.5 h-3.5 accent-[#D71920]"
                            />
                            <span>Show in Header</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={settingsForm.phone || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="e.g. +880 1712-345678"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Header Announcement Bar (Sliding Ticker Messages) */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-neutral-900 block">4. Header Announcement Bar (Sliding Notice Ticker)</span>
                        <span className="text-[11px] text-neutral-500">
                          Manage scrolling announcements shown in the desktop & mobile header
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 bg-white px-2.5 py-1.5 rounded-lg border border-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.showAnnouncementBar !== false}
                            onChange={e => setSettingsForm(prev => ({ ...prev, showAnnouncementBar: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-[#D71920]"
                          />
                          <span>Enable Bar</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const current = settingsForm.announcementItems || [];
                            setSettingsForm(prev => ({
                              ...prev,
                              announcementItems: [
                                ...current,
                                {
                                  id: 'ann-' + Date.now(),
                                  icon: '🔥',
                                  title: 'SPECIAL OFFER:',
                                  desc: 'Write your announcement text here...',
                                  isActive: true
                                }
                              ]
                            }));
                          }}
                          className="px-3 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Plus size={12} /> Add Notice
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {(settingsForm.announcementItems || []).map((item, idx) => (
                        <div key={item.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-[#E5E5E5] text-xs">
                          <div className="sm:col-span-1">
                            <input
                              type="text"
                              value={item.icon}
                              onChange={e => {
                                const updated = [...(settingsForm.announcementItems || [])];
                                updated[idx] = { ...updated[idx], icon: e.target.value };
                                setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                              }}
                              placeholder="⚡"
                              className="w-full px-1.5 py-1 text-center rounded-lg border border-neutral-300 bg-[#F7F7F8] font-bold"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              value={item.title}
                              onChange={e => {
                                const updated = [...(settingsForm.announcementItems || [])];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                              }}
                              placeholder="SPECIAL OFFER:"
                              className="w-full px-2.5 py-1 rounded-lg border border-neutral-300 bg-[#F7F7F8] font-black text-[#D71920]"
                            />
                          </div>
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={item.desc}
                              onChange={e => {
                                const updated = [...(settingsForm.announcementItems || [])];
                                updated[idx] = { ...updated[idx], desc: e.target.value };
                                setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                              }}
                              placeholder="Announcement details..."
                              className="w-full px-2.5 py-1 rounded-lg border border-neutral-300 bg-[#F7F7F8] font-semibold text-neutral-900"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-end gap-2">
                            <label className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isActive !== false}
                                onChange={e => {
                                  const updated = [...(settingsForm.announcementItems || [])];
                                  updated[idx] = { ...updated[idx], isActive: e.target.checked };
                                  setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                                }}
                                className="w-3.5 h-3.5 accent-[#D71920]"
                              />
                              <span>Active</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (settingsForm.announcementItems || []).filter((_, i) => i !== idx);
                                setSettingsForm(prev => ({ ...prev, announcementItems: updated }));
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 5: Theme & Dark Mode Settings */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-neutral-900 flex items-center gap-1.5">
                          <Moon size={14} className="text-[#D71920]" />
                          5. ডার্ক থিম ও ডিসপ্লে কন্ট্রোল (Dark & Day Theme Settings)
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          ওয়েবসাইটে ডার্ক থিম সুইচার বাটন অন/অফ রাখুন। ডিফল্টভাবে ভিজিটরদের জন্য অলওয়েজ ডে থিম (লাইট মোড) থাকবে।
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 bg-white px-3 py-1.5 rounded-xl border border-neutral-300 cursor-pointer shadow-2xs">
                        <input
                          type="checkbox"
                          checked={settingsForm.enableThemeToggle !== false}
                          onChange={e => setSettingsForm(prev => ({ ...prev, enableThemeToggle: e.target.checked }))}
                          className="w-4 h-4 accent-[#D71920]"
                        />
                        <span>থিম সুইচার সক্রিয় (Enable Theme Toggle)</span>
                      </label>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                          <Sun size={13} className="text-amber-500" />
                          <span>ডিফল্ট পার্মানেন্ট থিম: <strong>ডে থিম (লাইট মোড)</strong></span>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          ভিজিটররা চাইলে হেডারের চাঁদ বা সূর্য আইকনে ক্লিক করে এক ক্লিকে সম্পূর্ণ ওয়েবসাইটকে প্রিমিয়াম ডার্ক মোডে পরিবর্তন করতে পারবেন।
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">
                          ✓ লাল ব্র্যান্ড অ্যাকসেন্ট সংরক্ষিত (#D71920)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Skeleton Screen & Instant Loading Performance Control */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-neutral-900 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#D71920]" />
                          6. স্কেলেটন লোডিং ও ইনস্ট্যান্ট রেন্ডার কন্ট্রোল (Skeleton Screen Settings)
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          ব্যাকগ্রাউন্ডে ফায়ারবেস ডেটা লোড হওয়ার সময় কোনো টেক্সট মেসেজ ছাড়াই তাৎক্ষণিক ভিজ্যুয়াল UI স্কেলেটন প্রদর্শন নিয়ন্ত্রণ করুন।
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 bg-white px-3 py-1.5 rounded-xl border border-neutral-300 cursor-pointer shadow-2xs">
                        <input
                          type="checkbox"
                          checked={settingsForm.enableSkeletonLoading !== false}
                          onChange={e => setSettingsForm(prev => ({ ...prev, enableSkeletonLoading: e.target.checked }))}
                          className="w-4 h-4 accent-[#D71920]"
                        />
                        <span>স্কেলেটন স্ক্রিন সক্রিয় (Enable Skeleton Screen)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-neutral-200 text-xs">
                      <div className="space-y-1">
                        <label className="block font-bold text-neutral-800 text-[11px]">
                          অ্যানিমেশন স্টাইল (Skeleton Animation Style)
                        </label>
                        <select
                          value={settingsForm.skeletonAnimationStyle || 'shimmer'}
                          onChange={e => setSettingsForm(prev => ({ ...prev, skeletonAnimationStyle: e.target.value as 'shimmer' | 'pulse' }))}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-[#F7F7F8] font-bold text-neutral-900 text-xs"
                        >
                          <option value="shimmer">Shimmer Wave (মডার্ন ওয়েভ শিমার)</option>
                          <option value="pulse">Soft Pulse (সফট পালস ইফেক্ট)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-neutral-800 text-[11px]">
                          সর্বোচ্চ ফলব্যাক টাইমআউট (Max Skeleton Duration)
                        </label>
                        <select
                          value={settingsForm.skeletonMaxDurationMs || 1200}
                          onChange={e => setSettingsForm(prev => ({ ...prev, skeletonMaxDurationMs: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-[#F7F7F8] font-bold text-neutral-900 text-xs"
                        >
                          <option value={800}>Ultra Fast (800ms)</option>
                          <option value={1200}>Balanced Default (1200ms)</option>
                          <option value={2000}>Extended Network Wait (2000ms)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Row 7: Firestore Cache-First (getDocFromCache) & Indexed Query Snapshots Control */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-xs text-neutral-900 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#D71920]" />
                          7. ফায়ারবেস ক্যাশ-ফার্স্ট (<code className="text-[11px] bg-white px-1 py-0.5 rounded border border-neutral-200">getDocFromCache</code>) ও কুয়েরি স্ন্যাপশট ইনডেক্সিং
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          প্রথমে লোকাল IndexedDB ক্যাশ (<code className="text-[10px]">getDocFromCache</code> / <code className="text-[10px]">getDocsFromCache</code>) থেকে ডেটা লোড করে প্রয়োজনে নেটওয়ার্কে ফলব্যাক এবং ইনডেক্সড কুয়েরি স্ন্যাপশট নিয়ন্ত্রণ করুন।
                        </span>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 bg-white px-3 py-1.5 rounded-xl border border-neutral-300 cursor-pointer shadow-2xs">
                        <input
                          type="checkbox"
                          checked={settingsForm.enableIndexedQuerySnapshots !== false}
                          onChange={e => setSettingsForm(prev => ({ ...prev, enableIndexedQuerySnapshots: e.target.checked }))}
                          className="w-4 h-4 accent-[#D71920]"
                        />
                        <span>ইনডেক্সড কুয়েরি স্ন্যাপশট সক্রিয় (Indexed Query Snapshots)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-neutral-200 text-xs">
                      <div className="space-y-1">
                        <label className="block font-bold text-neutral-800 text-[11px]">
                          ডেটা ফেচিং স্ট্র্যাটেজি (Firestore Fetch Strategy)
                        </label>
                        <select
                          value={settingsForm.firestoreFetchStrategy || 'cache-first'}
                          onChange={e =>
                            setSettingsForm(prev => ({
                              ...prev,
                              firestoreFetchStrategy: e.target.value as 'cache-first' | 'realtime-snapshot' | 'network-first'
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-[#F7F7F8] font-bold text-neutral-900 text-xs"
                        >
                          <option value="cache-first">Cache-First (getDocFromCache → Network Fallback) — Recommended</option>
                          <option value="realtime-snapshot">Indexed Query Snapshots Only (Real-Time Stream)</option>
                          <option value="network-first">Network-First Verification (Direct Server Fetch)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-neutral-800 text-[11px]">
                          ইনডেক্সড কুয়েরি স্ন্যাপশট লিমিট (Initial Query Snapshot Batch Limit)
                        </label>
                        <select
                          value={settingsForm.firestoreQueryLimit || 250}
                          onChange={e => setSettingsForm(prev => ({ ...prev, firestoreQueryLimit: Number(e.target.value) }))}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-[#F7F7F8] font-bold text-neutral-900 text-xs"
                        >
                          <option value={100}>Ultra Light Batch (100 docs / query)</option>
                          <option value={250}>Optimal Indexed Batch (250 docs / query)</option>
                          <option value={500}>Extended Catalog Batch (500 docs / query)</option>
                          <option value={1000}>Maximum Batch (1000 docs / query)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">
                          ✓ সক্রিয় সোর্স: {cacheTelemetry.lastSource === 'cache' ? 'IndexedDB Cache (getDocFromCache)' : cacheTelemetry.lastSource === 'local-storage' ? 'Instant Local Cache (0ms)' : 'Firestore Network Snapshot'}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-bold border border-neutral-200">
                          Cache Hits: {cacheTelemetry.cacheHits} • Network Syncs: {cacheTelemetry.networkFetches}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void refreshStoreCacheFirst(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Test Cache-First Fetch
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearLocalStoreCache();
                            void refreshStoreCacheFirst(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Clear Cache & Re-Sync Network
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* SUB-TAB 2: FOOTER & LINKS (Logo, Name/Colors, Footer Color, Payment)  */}
              {/* ===================================================================== */}
              {settingsSubTab === 'footer' && (
                <div className="space-y-4">
                  {/* Row 1: Footer Background & Card Color Customizer + Live Preview */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                      <div>
                        <span className="font-black text-neutral-900 block">1. Footer Color Theme (Day Mode & Dark Mode)</span>
                        <span className="text-[11px] text-neutral-500">
                          Dynamically configure Footer colors for both Light/Day Mode and Dark Theme. Saved in Firebase.
                        </span>
                      </div>

                      {/* Quick Preset Color Themes */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-neutral-500 mr-1">Dark Presets:</span>
                        {[
                          { label: 'Deep Obsidian', bg: '#070A0F', card: '#0E1420' },
                          { label: 'Classic Dark', bg: '#121212', card: '#1c1c1e' },
                          { label: 'Midnight Navy', bg: '#0b1120', card: '#131e33' },
                          { label: 'Crimson Night', bg: '#170a0c', card: '#251216' }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, footerDarkBgColor: preset.bg, footerDarkCardBgColor: preset.card }))}
                            className="px-2 py-1 rounded-lg border border-neutral-300 bg-white hover:border-[#D71920] text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: preset.bg }} />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Section A: Light / Day Mode Footer Colors */}
                      <div className="p-3.5 rounded-xl bg-white border border-neutral-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            Day Mode Footer (Light Theme)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, footerBgColor: '#F8FAFC', footerCardBgColor: '#FFFFFF' }))}
                            className="text-[11px] font-bold text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
                          >
                            Reset Light Defaults
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-3">
                            <label className="block font-bold text-[#5F6368] uppercase text-[10.5px] mb-1">Day Footer Background</label>
                            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5">
                              <input
                                type="color"
                                value={settingsForm.footerBgColor || '#F8FAFC'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerBgColor: e.target.value }))}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                              />
                              <input
                                type="text"
                                value={settingsForm.footerBgColor || '#F8FAFC'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerBgColor: e.target.value }))}
                                className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block font-bold text-[#5F6368] uppercase text-[10.5px] mb-1">Day Card / Box Background</label>
                            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5">
                              <input
                                type="color"
                                value={settingsForm.footerCardBgColor || '#FFFFFF'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerCardBgColor: e.target.value }))}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                              />
                              <input
                                type="text"
                                value={settingsForm.footerCardBgColor || '#FFFFFF'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerCardBgColor: e.target.value }))}
                                className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>

                          {/* Day Preview */}
                          <div className="md:col-span-6">
                            <div
                              className="p-2.5 rounded-xl border border-neutral-200 flex items-center justify-between gap-2 shadow-2xs"
                              style={{ backgroundColor: settingsForm.footerBgColor || '#F8FAFC' }}
                            >
                              <div
                                className="px-3 py-1.5 rounded-lg border border-neutral-200 flex items-center gap-2 flex-1 shadow-2xs"
                                style={{ backgroundColor: settingsForm.footerCardBgColor || '#FFFFFF' }}
                              >
                                <span className="font-black text-xs tracking-tight text-neutral-900">
                                  <span>MR. </span>
                                  <span className="text-[#D71920]">BOOKS</span>
                                </span>
                                <span className="text-[10px] text-neutral-500 truncate">Day Theme Preview</span>
                              </div>
                              <span className="text-[10px] font-bold text-neutral-400 shrink-0">Day</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Dark Mode Footer Colors */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                            Dark Mode Footer (Dark Theme)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, footerDarkBgColor: '#070A0F', footerDarkCardBgColor: '#0E1420' }))}
                            className="text-[11px] font-bold text-slate-400 hover:text-white hover:underline cursor-pointer"
                          >
                            Reset Dark Defaults
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-3">
                            <label className="block font-bold text-slate-400 uppercase text-[10.5px] mb-1">Dark Footer Background</label>
                            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5">
                              <input
                                type="color"
                                value={settingsForm.footerDarkBgColor || '#070A0F'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkBgColor: e.target.value }))}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                              />
                              <input
                                type="text"
                                value={settingsForm.footerDarkBgColor || '#070A0F'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkBgColor: e.target.value }))}
                                className="w-full text-xs font-mono font-bold text-white focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block font-bold text-slate-400 uppercase text-[10.5px] mb-1">Dark Card / Box Background</label>
                            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5">
                              <input
                                type="color"
                                value={settingsForm.footerDarkCardBgColor || '#0E1420'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkCardBgColor: e.target.value }))}
                                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                              />
                              <input
                                type="text"
                                value={settingsForm.footerDarkCardBgColor || '#0E1420'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, footerDarkCardBgColor: e.target.value }))}
                                className="w-full text-xs font-mono font-bold text-white focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>

                          {/* Dark Preview */}
                          <div className="md:col-span-6">
                            <div
                              className="p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2 shadow-2xs"
                              style={{ backgroundColor: settingsForm.footerDarkBgColor || '#070A0F' }}
                            >
                              <div
                                className="px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 flex-1 shadow-2xs"
                                style={{ backgroundColor: settingsForm.footerDarkCardBgColor || '#0E1420' }}
                              >
                                <span className="font-black text-xs tracking-tight text-white">
                                  <span>MR. </span>
                                  <span className="text-[#D71920]">BOOKS</span>
                                </span>
                                <span className="text-[10px] text-zinc-400 truncate">Dark Theme Preview</span>
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400 shrink-0">Dark</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Footer Logo Upload + Single Payment Methods Picture Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Footer Logo Upload Card */}
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-neutral-900 block">2. Footer Brand Logo (Optional)</span>
                          <span className="text-[11px] text-neutral-500">Upload a custom logo for the footer brand box</span>
                        </div>
                        {isValidImageUrl(settingsForm.footerLogoUrl) && (
                          <button
                            type="button"
                            onClick={async () => {
                              setSettingsForm(prev => ({ ...prev, footerLogoUrl: '' }));
                              await updateSettings({ footerLogoUrl: '' });
                              setToast({ show: true, type: 'success', message: 'Footer logo removed!' });
                            }}
                            className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Remove Footer Logo
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#1c1c1e] border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                          {isValidImageUrl(settingsForm.footerLogoUrl) ? (
                            <img
                              src={settingsForm.footerLogoUrl}
                              alt="Footer Logo"
                              onError={() => setSettingsForm(prev => ({ ...prev, footerLogoUrl: '' }))}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400">No Logo</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors">
                              <Upload size={12} />
                              <span>Upload Footer Logo</span>
                              <input
                                type="file"
                                accept="image/*,.svg,.ico"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  try {
                                    const dataUrl = await compressImageFile(file, 400, 400, 0.9);
                                    setSettingsForm(prev => ({ ...prev, footerLogoUrl: dataUrl }));
                                    await updateSettings({ footerLogoUrl: dataUrl });
                                    setToast({ show: true, type: 'success', message: 'Footer logo uploaded & saved in real-time!' });
                                  } catch (err: any) {
                                    console.error('Footer logo upload error:', err);
                                    setToast({ show: true, type: 'error', message: err?.message || 'Failed to upload footer logo' });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Or paste Footer Logo URL (https://...)"
                            value={isValidImageUrl(settingsForm.footerLogoUrl) ? settingsForm.footerLogoUrl : ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerLogoUrl: sanitizeImageUrl(e.target.value) }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Single Payment Options Banner Picture Upload (Like a Logo) */}
                    <div className="p-3.5 rounded-xl bg-[#FFF1F2]/50 border border-[#D71920]/25 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-[#171717] block">3. Payment Methods Single Picture</span>
                          <span className="text-[11px] text-[#5F6368]">Upload one combined image for all payment methods</span>
                        </div>
                        {isValidImageUrl(settingsForm.footerPaymentBannerUrl) && (
                          <button
                            type="button"
                            onClick={async () => {
                              setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: '' }));
                              await updateSettings({ footerPaymentBannerUrl: '' });
                              setToast({ show: true, type: 'success', message: 'Payment methods picture removed!' });
                            }}
                            className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Remove Picture
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-24 h-12 rounded-xl bg-[#1c1c1e] border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-2xs">
                          {isValidImageUrl(settingsForm.footerPaymentBannerUrl) ? (
                            <img
                              src={settingsForm.footerPaymentBannerUrl}
                              alt="Payment Banner"
                              onError={() => setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: '' }))}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-400 text-center leading-tight">Default Strip</span>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs transition-colors">
                              <Upload size={12} />
                              <span>Upload Payment Picture</span>
                              <input
                                type="file"
                                accept="image/*,.svg"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  try {
                                    const dataUrl = await compressImageFile(file, 800, 300, 0.92);
                                    setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: dataUrl }));
                                    await updateSettings({ footerPaymentBannerUrl: dataUrl });
                                    setToast({ show: true, type: 'success', message: 'Payment methods picture uploaded & saved!' });
                                  } catch (err: any) {
                                    console.error('Payment banner upload error:', err);
                                    setToast({ show: true, type: 'error', message: err?.message || 'Failed to upload payment picture' });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Or paste Payment Banner Image URL (https://...)"
                            value={isValidImageUrl(settingsForm.footerPaymentBannerUrl) ? settingsForm.footerPaymentBannerUrl : ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerPaymentBannerUrl: sanitizeImageUrl(e.target.value) }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs text-neutral-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Footer Brand Name, Two-Tone Colors & Icon Toggle */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
                      <div>
                        <span className="font-black text-neutral-900 block">4. Footer Brand Name, Colors & Optional Icon</span>
                        <span className="text-[11px] text-neutral-500">
                          Same as Header: change 1st & 2nd word colors, or clear the name to remove both name & default icon.
                        </span>
                      </div>
                      <label className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                        !(settingsForm.footerBrandName || '').trim() || settingsForm.footerLogoUrl
                          ? 'opacity-50 bg-neutral-100 border-neutral-200 text-neutral-400'
                          : 'bg-white border-neutral-300 text-neutral-800'
                      }`}>
                        <input
                          type="checkbox"
                          checked={Boolean((settingsForm.footerBrandName || '').trim()) && !settingsForm.footerLogoUrl && settingsForm.showFooterIcon !== false}
                          disabled={!(settingsForm.footerBrandName || '').trim() || Boolean(settingsForm.footerLogoUrl)}
                          onChange={e => setSettingsForm(prev => ({ ...prev, showFooterIcon: e.target.checked }))}
                          className="w-3.5 h-3.5 accent-[#D71920]"
                        />
                        <span>Show Icon with Footer Name</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-[#5F6368] uppercase text-[11px]">Footer Brand Name</label>
                          {settingsForm.footerBrandName && (
                            <button
                              type="button"
                              onClick={() => setSettingsForm(prev => ({ ...prev, footerBrandName: '' }))}
                              className="text-[10px] font-bold text-[#D71920] hover:underline cursor-pointer"
                            >
                              Clear Name & Icon
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={settingsForm.footerBrandName ?? ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, footerBrandName: e.target.value }))}
                          placeholder="e.g. MR. BOOKS (Leave empty for Logo only)"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold text-xs"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block font-bold text-[#5F6368] uppercase text-[11px] mb-1">1st Word Color (Footer)</label>
                        <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2 py-1">
                          <input
                            type="color"
                            value={settingsForm.footerNameColor1 || '#FFFFFF'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor1: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.footerNameColor1 || '#FFFFFF'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor1: e.target.value }))}
                            className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block font-bold text-[#5F6368] uppercase text-[11px] mb-1">2nd Word & Icon Color (Footer)</label>
                        <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-xl px-2 py-1">
                          <input
                            type="color"
                            value={settingsForm.footerNameColor2 || '#D71920'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor2: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.footerNameColor2 || '#D71920'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerNameColor2: e.target.value }))}
                            className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Short Description, Address, Email, Copyright */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/80">
                      <div className="sm:col-span-2">
                        <label className="block font-bold uppercase text-[#5F6368] text-[11px] mb-1">Footer Short Description (About Text)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.footerDescription || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, footerDescription: e.target.value }))}
                          placeholder="Bangladesh's premier online bookstore and stationery shop..."
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[#5F6368] text-[11px] mb-1">Store Address (Shown in Footer)</label>
                        <input
                          type="text"
                          value={settingsForm.address || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[#5F6368] text-[11px] mb-1">Support Email (Shown in Footer)</label>
                        <input
                          type="email"
                          value={settingsForm.email || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[#5F6368] text-[11px] mb-1">Copyright Text (Bottom Left)</label>
                        <input
                          type="text"
                          value={settingsForm.copyrightText || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, copyrightText: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold uppercase text-[#5F6368] text-[11px] mb-1">Footer Bottom Tagline (Bottom Right)</label>
                        <input
                          type="text"
                          value={settingsForm.footerBottomTagline ?? 'Designed for book lovers in Bangladesh.'}
                          onChange={e => setSettingsForm(prev => ({ ...prev, footerBottomTagline: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: VIP Subscription & Order Tracking Strip Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <Gift size={14} className="text-[#D71920]" />
                          <span className="font-black text-neutral-800">Footer VIP Subscription Box</span>
                        </div>
                        <label className="flex items-center gap-1.5 font-bold text-neutral-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.showFooterSubscription !== false}
                            onChange={e => setSettingsForm(prev => ({ ...prev, showFooterSubscription: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-[#D71920]"
                          />
                          <span>Enabled</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Heading</label>
                          <input
                            type="text"
                            value={settingsForm.subscriptionTitle || ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, subscriptionTitle: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Promo Badge</label>
                          <input
                            type="text"
                            value={settingsForm.subscriptionDiscountBadge || ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, subscriptionDiscountBadge: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <Truck size={14} className="text-[#D71920]" />
                          <span className="font-black text-neutral-800">Footer Order Tracking Box</span>
                        </div>
                        <label className="flex items-center gap-1.5 font-bold text-neutral-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.showFooterTracking !== false}
                            onChange={e => setSettingsForm(prev => ({ ...prev, showFooterTracking: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-[#D71920]"
                          />
                          <span>Enabled</span>
                        </label>
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Tracking Box Heading</label>
                        <input
                          type="text"
                          value={settingsForm.trackingTitle || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, trackingTitle: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Coupons, Cancel & Exchange Policy, and Live Chat Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <TicketPercent size={14} className="text-[#D71920]" />
                          <span className="font-black text-neutral-800">Footer Coupons Strip Option</span>
                        </div>
                        <label className="flex items-center gap-1.5 font-bold text-neutral-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.showFooterCoupons !== false}
                            onChange={e => setSettingsForm(prev => ({ ...prev, showFooterCoupons: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-[#D71920]"
                          />
                          <span>Enabled</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Coupons Title</label>
                          <input
                            type="text"
                            value={settingsForm.couponsTitle ?? 'Coupons'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, couponsTitle: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Coupons Badge</label>
                          <input
                            type="text"
                            value={settingsForm.couponsBadge ?? '3 Offers'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, couponsBadge: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle size={14} className="text-[#D71920]" />
                          <span className="font-black text-neutral-800">Customer Live Chat Widget</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="flex items-center gap-1.5 font-bold text-neutral-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.enableLiveChatSound !== false}
                              onChange={e => setSettingsForm(prev => ({ ...prev, enableLiveChatSound: e.target.checked }))}
                              className="w-3.5 h-3.5 accent-[#D71920]"
                            />
                            <span>Ringtone Sound</span>
                          </label>
                          <label className="flex items-center gap-1.5 font-bold text-neutral-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settingsForm.enableLiveChat !== false}
                              onChange={e => setSettingsForm(prev => ({ ...prev, enableLiveChat: e.target.checked }))}
                              className="w-3.5 h-3.5 accent-[#D71920]"
                            />
                            <span>Enabled</span>
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Chat Title</label>
                          <input
                            type="text"
                            value={settingsForm.liveChatTitle ?? 'MR. BOOKS Live Support'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, liveChatTitle: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Welcome Note</label>
                          <input
                            type="text"
                            value={settingsForm.liveChatWelcomeMessage ?? ''}
                            onChange={e => setSettingsForm(prev => ({ ...prev, liveChatWelcomeMessage: e.target.value }))}
                            placeholder="Welcome message..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-medium"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">
                          Quick Canned Replies (এক লাইনে একটি করে দ্রুত উত্তর লিখুন)
                        </label>
                        <textarea
                          rows={3}
                          value={(settingsForm.liveChatQuickReplies && settingsForm.liveChatQuickReplies.length > 0
                            ? settingsForm.liveChatQuickReplies
                            : DEFAULT_LIVE_CHAT_QUICK_REPLIES
                          ).join('\n')}
                          onChange={e =>
                            setSettingsForm(prev => ({
                              ...prev,
                              liveChatQuickReplies: e.target.value
                                .split('\n')
                                .map(line => line.trim())
                                .filter(Boolean),
                            }))
                          }
                          placeholder="প্রতি লাইনে একটি দ্রুত উত্তর লিখুন..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-[11px] font-medium focus:outline-none focus:border-[#D71920]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 6: Cancel & Exchange Policy Dynamic Content */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                      <div className="flex items-center gap-1.5">
                        <RefreshCw size={14} className="text-[#D71920]" />
                        <span className="font-black text-neutral-800">Footer Cancel & Exchange Policy Box</span>
                      </div>
                      <label className="flex items-center gap-1.5 font-bold text-neutral-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.showFooterPolicy !== false}
                          onChange={e => setSettingsForm(prev => ({ ...prev, showFooterPolicy: e.target.checked }))}
                          className="w-3.5 h-3.5 accent-[#D71920]"
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Policy Button Title</label>
                        <input
                          type="text"
                          value={settingsForm.policyTitle ?? 'Cancel & Exchange'}
                          onChange={e => setSettingsForm(prev => ({ ...prev, policyTitle: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Policy Badge</label>
                        <input
                          type="text"
                          value={settingsForm.policyBadge ?? 'Policy'}
                          onChange={e => setSettingsForm(prev => ({ ...prev, policyBadge: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-neutral-600 mb-1 text-[10px] uppercase">Policy Text (Popup Content)</label>
                      <textarea
                        rows={3}
                        value={settingsForm.cancelExchangePolicyText ?? DEFAULT_CANCEL_EXCHANGE_POLICY}
                        onChange={e => setSettingsForm(prev => ({ ...prev, cancelExchangePolicyText: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-300 bg-white text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* SUB-TAB 3: PAYMENT & SHIPPING (COD, Dhaka/Outside & Courier Rates)    */}
              {/* ===================================================================== */}
              {settingsSubTab === 'shipping' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#FFF1F2]/60 border border-[#D71920]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-xs text-[#171717] block">Checkout Payment Gateways (COD, bKash, Nagad, Rocket, Upay)</span>
                      <span className="text-[11px] text-[#5F6368]">
                        Manage individual checkout payment methods, account numbers, and custom offers in the dedicated Payment Methods tab.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('payment-methods')}
                      className="px-3.5 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs shrink-0"
                    >
                      <CreditCard size={13} />
                      <span>Open Payment Methods Manager</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Inside Dhaka Delivery Fee (৳)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.insideDhakaCharge ?? 60}
                        onChange={e => setSettingsForm(prev => ({ ...prev, insideDhakaCharge: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-black text-sm"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Sub Area Delivery Fee (৳)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.subAreaCharge ?? 90}
                        onChange={e => setSettingsForm(prev => ({ ...prev, subAreaCharge: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-black text-sm"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Outside Dhaka Delivery Fee (৳)</label>
                      <input
                        type="number"
                        required
                        value={settingsForm.outsideDhakaCharge ?? 120}
                        onChange={e => setSettingsForm(prev => ({ ...prev, outsideDhakaCharge: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-black text-sm"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Free Delivery Minimum Order (৳)</label>
                      <input
                        type="number"
                        value={settingsForm.freeShippingThreshold ?? 2000}
                        onChange={e => setSettingsForm(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-black text-sm"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Sundarban Courier Fee (৳)</label>
                      <input
                        type="number"
                        value={settingsForm.sundarbanDeliveryCharge ?? 120}
                        onChange={e => setSettingsForm(prev => ({ ...prev, sundarbanDeliveryCharge: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Extra Weight Charge / Kg (৳)</label>
                      <input
                        type="number"
                        value={settingsForm.extraWeightChargePerKg ?? 20}
                        onChange={e => setSettingsForm(prev => ({ ...prev, extraWeightChargePerKg: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold"
                      />
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200">
                      <label className="block font-bold uppercase text-[#5F6368] mb-1">Official bKash Number</label>
                      <input
                        type="text"
                        value={settingsForm.bkashNumber || ''}
                        onChange={e => setSettingsForm(prev => ({ ...prev, bkashNumber: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold"
                      />
                    </div>

                    {/* Returning Customer "Use Old Address" Autofill Feature */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 col-span-1 sm:col-span-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-neutral-900 block text-xs uppercase">
                            পুরান কাস্টমারদের জন্য 'ইউজ ওল্ড এড্রেস / সেম অ্যাড্রেস' বাটন (Use Old Address Button)
                          </span>
                          <span className="text-[11px] text-neutral-600 block mt-0.5">
                            চেকআউটে পুরান কাস্টমাররা যাতে এক ক্লিকে তাদের পূর্বের সংরক্ষিত নাম ও ডেলিভারি ঠিকানা পূরণ করতে পারেন।
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.enableUseOldAddress !== false}
                            onChange={e => setSettingsForm(prev => ({ ...prev, enableUseOldAddress: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71920]"></div>
                        </label>
                      </div>

                      {settingsForm.enableUseOldAddress !== false && (
                        <div>
                          <label className="block font-bold uppercase text-[#5F6368] mb-1 text-[11px]">
                            বাটন লেবেল টেক্সট (Button Label / Text)
                          </label>
                          <input
                            type="text"
                            value={settingsForm.oldAddressButtonLabel ?? 'ইউজ ওল্ড এড্রেস (সেম অ্যাড্রেস)'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, oldAddressButtonLabel: e.target.value }))}
                            placeholder="ইউজ ওল্ড এড্রেস (সেম অ্যাড্রেস)"
                            className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bangla QR (বাংলা কিউআর) Settings */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 col-span-1 sm:col-span-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-neutral-900 block text-xs uppercase flex items-center gap-1.5">
                            <QrCode size={15} className="text-emerald-700" />
                            বাংলা কিউআর (Bangla QR) সেটিংস ও কিউআর ইমেজ
                          </span>
                          <span className="text-[11px] text-neutral-600 block mt-0.5">
                            চেকআউট পপআপে বাংলা কিউআর অপশন প্রদর্শন করুন। গ্রাহকরা কিউআর ডাউনলোড করে যেকোনো ব্যাংক বা এমএফএস অ্যাপ থেকে স্ক্যান করে পেমেন্ট করতে পারবেন।
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm.enableBanglaQr !== false}
                            onChange={e => setSettingsForm(prev => ({ ...prev, enableBanglaQr: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {settingsForm.enableBanglaQr !== false && (
                        <div className="space-y-3 pt-2 border-t border-emerald-200/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold uppercase text-[#5F6368] mb-1 text-[11px]">
                                মার্চেন্ট / একাউন্ট নাম (Merchant Name)
                              </label>
                              <input
                                type="text"
                                value={settingsForm.banglaQrAccountName ?? 'MR. BOOKS BD'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrAccountName: e.target.value }))}
                                placeholder="MR. BOOKS BD"
                                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-bold uppercase text-[#5F6368] mb-1 text-[11px]">
                                মার্চেন্ট আইডি / একাউন্ট নাম্বার (Merchant Number)
                              </label>
                              <input
                                type="text"
                                value={settingsForm.banglaQrNumber ?? '01712345678'}
                                onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrNumber: e.target.value }))}
                                placeholder="01712345678"
                                className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-bold text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-bold uppercase text-[#5F6368] text-[11px]">
                                বাংলা কিউআর কোড ছবি (Bangla QR Code Image)
                              </label>
                              {isValidImageUrl(settingsForm.banglaQrImageUrl) && (
                                <button
                                  type="button"
                                  onClick={() => setSettingsForm(prev => ({ ...prev, banglaQrImageUrl: '' }))}
                                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                  Remove QR Image
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-xl bg-white border border-emerald-200 flex items-center justify-center overflow-hidden shrink-0 p-1 shadow-2xs">
                                {isValidImageUrl(settingsForm.banglaQrImageUrl) ? (
                                  <img
                                    src={settingsForm.banglaQrImageUrl}
                                    alt="Bangla QR"
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-emerald-700 leading-none">
                                    <QrCode size={22} />
                                    <span className="text-[7.5px] font-bold mt-1">Auto QR</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Paste Bangla QR Code Image URL"
                                    value={isValidImageUrl(settingsForm.banglaQrImageUrl) ? settingsForm.banglaQrImageUrl : ''}
                                    onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrImageUrl: sanitizeImageUrl(e.target.value) }))}
                                    className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-mono text-[#171717]"
                                  />
                                  <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-2xs">
                                    <Upload size={13} />
                                    <span>Upload QR</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async e => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        if (file) {
                                          try {
                                            const compressed = await compressImageFile(file, 700, 700, 0.88);
                                            setSettingsForm(prev => ({ ...prev, banglaQrImageUrl: compressed }));
                                            await updateSettings({ banglaQrImageUrl: compressed });
                                            setToast({ show: true, type: 'success', message: 'Bangla QR image uploaded and saved!' });
                                          } catch (err: any) {
                                            setToast({ show: true, type: 'error', message: err.message || 'Failed to upload QR image' });
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                                <p className="text-[10px] text-neutral-500">
                                  Customers will see this QR code and can click 'কিউআর ডাউনলোড করুন' in the Checkout popup to download it directly.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold uppercase text-[#5F6368] mb-1 text-[11px]">
                              পেমেন্ট নির্দেশনা (Payment Instructions)
                            </label>
                            <textarea
                              rows={2}
                              value={settingsForm.banglaQrInstructions ?? 'বিকাশ, নগদ, রকেট, উপায় বা যেকোনো ব্যাংক অ্যাপের বাংলা কিউআর (Bangla QR) স্ক্যানার দিয়ে স্ক্যান করে পেমেন্ট করুন এবং ট্রানজেকশন আইডি নিচে দিন।'}
                              onChange={e => setSettingsForm(prev => ({ ...prev, banglaQrInstructions: e.target.value }))}
                              placeholder="বিকাশ, নগদ, রকেট, উপায় বা যেকোনো ব্যাংক অ্যাপের বাংলা কিউআর..."
                              className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-[#171717] font-medium text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* SUB-TAB 4: SOCIAL MEDIA & DIRECT SUPPORT LINKS                        */}
              {/* ===================================================================== */}
              {settingsSubTab === 'social' && (
                <div className="space-y-4">
                  {/* Footer Social Media Icons & Links */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-neutral-900 uppercase">Footer Social Media Links</span>
                        <input
                          type="text"
                          value={settingsForm.footerSocialTitle ?? 'Social Media'}
                          onChange={e => setSettingsForm(prev => ({ ...prev, footerSocialTitle: e.target.value }))}
                          placeholder="Social Media Heading"
                          className="px-2.5 py-1 rounded-lg border border-neutral-300 bg-white font-bold text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const current = settingsForm.socialLinks || [];
                          setSettingsForm(prev => ({
                            ...prev,
                            socialLinks: [
                              ...current,
                              { id: 'soc-' + Date.now(), name: 'Facebook', url: 'https://facebook.com', icon: 'facebook', isActive: true }
                            ]
                          }));
                        }}
                        className="px-3 py-1.5 bg-[#D71920] text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        <Plus size={12} /> Add Social Link
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(settingsForm.socialLinks || []).map((soc, idx) => (
                        <div key={soc.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-[#E5E5E5]">
                          <input
                            type="text"
                            placeholder="Platform Name (e.g. Facebook)"
                            value={soc.name}
                            onChange={e => {
                              const updated = [...(settingsForm.socialLinks || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                            }}
                            className="sm:col-span-4 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                          />
                          <input
                            type="text"
                            placeholder="URL (https://...)"
                            value={soc.url}
                            onChange={e => {
                              const updated = [...(settingsForm.socialLinks || [])];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                            }}
                            className="sm:col-span-6 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                          />
                          <div className="sm:col-span-2 flex items-center justify-end gap-2">
                            <label className="flex items-center gap-1 text-xs font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={soc.isActive}
                                onChange={e => {
                                  const updated = [...(settingsForm.socialLinks || [])];
                                  updated[idx] = { ...updated[idx], isActive: e.target.checked };
                                  setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                                }}
                                className="w-3.5 h-3.5 accent-[#D71920]"
                              />
                              <span>Active</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (settingsForm.socialLinks || []).filter((_, i) => i !== idx);
                                setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Product Page Support Action Buttons */}
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <div>
                      <span className="font-black text-xs text-neutral-900 uppercase block">Direct Support Action Buttons (Product Page)</span>
                      <span className="text-[11px] text-neutral-500">WhatsApp, Hotline Call, Telegram, and Messenger quick chat buttons</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-[#0A8754] block">WhatsApp Number</span>
                        <input
                          type="text"
                          placeholder="+880 1712-345678"
                          value={settingsForm.whatsappNumber || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-[#1D63D8] block">Hotline / Call Number</span>
                        <input
                          type="text"
                          placeholder="01712345678"
                          value={settingsForm.callNumber || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, callNumber: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-[#0088CC] block">Telegram URL</span>
                        <input
                          type="text"
                          placeholder="https://t.me/mrbooksbd"
                          value={settingsForm.telegramUrl || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, telegramUrl: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-1.5">
                        <span className="text-[11px] font-bold text-[#0084FF] block">Facebook Messenger URL</span>
                        <input
                          type="text"
                          placeholder="https://m.me/mrbooksbd"
                          value={settingsForm.messengerUrl || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, messengerUrl: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================== */}
              {/* SUB-TAB 5: SEO & MARKETING (Meta Tags, Pixel, CAPI, GA4)              */}
              {/* ===================================================================== */}
              {settingsSubTab === 'seo' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <span className="font-black text-neutral-900 uppercase block">SEO & Open Graph Metadata</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#5F6368] mb-1">Meta Title</label>
                        <input
                          type="text"
                          value={settingsForm.metaTitle || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#5F6368] mb-1">Meta Description</label>
                        <textarea
                          rows={2}
                          value={settingsForm.metaDescription || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Open Graph Image URL</label>
                        <input
                          type="text"
                          value={settingsForm.ogImageUrl || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, ogImageUrl: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Keywords</label>
                        <input
                          type="text"
                          value={settingsForm.keywords || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, keywords: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-neutral-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-black text-neutral-900 uppercase block">
                          Marketing & Conversion Tracking (Pixel / CAPI / GA4)
                        </span>
                        <span className="text-[11px] text-emerald-700 font-bold">
                          Event Match Quality: 9.6 / 10 • Data Transfer Ratio: 9.8 / 10 (SHA-256 + Event ID Deduplicated)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('capi')}
                        className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-[11px] font-extrabold cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <Server size={12} />
                        <span>Open Full Conversion API Manager</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Facebook Pixel ID (Dataset ID)</label>
                        <input
                          type="text"
                          placeholder="e.g. 123456789012345"
                          value={settingsForm.facebookPixelId || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Facebook CAPI Access Token</label>
                        <input
                          type="password"
                          placeholder="EAABsbCS1iHgBO..."
                          value={settingsForm.facebookCapiToken || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, facebookCapiToken: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Facebook Test Event Code (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. TEST12345"
                          value={settingsForm.facebookTestEventCode || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, facebookTestEventCode: e.target.value, facebookTestModeEnabled: Boolean(e.target.value.trim()) }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Google Analytics (GA4) ID</label>
                        <input
                          type="text"
                          value={settingsForm.gaMeasurementId || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, gaMeasurementId: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">TikTok Pixel ID</label>
                        <input
                          type="text"
                          value={settingsForm.tiktokPixelId || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#EEEEEE] flex justify-end">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-5 py-2 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {settingsSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving to Firebase...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: FACEBOOK PIXEL & CONVERSIONS API (CAPI) MANAGER */}
        {activeTab === 'capi' && (
          <AdminConversionApiManager
            settings={settings}
            onUpdateSettings={updateSettings}
            onShowToast={(message, type) =>
              setToast({ show: true, type: type || 'success', message })
            }
          />
        )}

        {/* TAB 14: STAFF & ROLES ACCESS CONTROL (Manager, Employee, Custom Permissions) */}
        {activeTab === 'staff' && (
          <AdminStaffManagement
            staffMembers={staffMembers}
            onAddStaff={addStaffMember}
            onUpdateStaff={updateStaffMember}
            onDeleteStaff={deleteStaffMember}
            currentStaffRole={staffRole}
            currentUserEmail={currentUser?.email || null}
            setToast={(t) => setToast({ show: t.show, type: t.type, message: t.message })}
          />
        )}

        {/* TAB 15: DEDICATED ADMIN PROFILE & CREDENTIALS MANAGEMENT */}
        {activeTab === 'profile' && (
          <AdminProfileManagement
            settings={settings}
            updateSettings={updateSettings}
            currentStaff={currentStaff}
            staffRole={staffRole}
            currentUser={currentUser}
            onUpdateStaff={updateStaffMember}
            onLogout={async () => {
              await logout();
              setActivePage('admin');
            }}
            totalOrdersCount={orders.length}
            totalProductsCount={products.length}
            totalStaffCount={staffMembers.length}
            setToast={(t) => setToast({ show: t.show, type: t.type, message: t.message })}
          />
        )}

        {/* TAB 16: COUPONS & PROMO OFFERS MANAGER */}
        {activeTab === 'coupons' && (
          <AdminCouponsManager
            coupons={coupons}
            onAddCoupon={addCoupon}
            onUpdateCoupon={updateCoupon}
            onDeleteCoupon={deleteCoupon}
            setToast={(t) => setToast({ show: t.show, type: t.type, message: t.message })}
          />
        )}

        {/* TAB 17: LIVE CHAT INBOX & SUPPORT MANAGER */}
        {activeTab === 'live-chat' && (
          <AdminLiveChatManager
            sessions={liveChatSessions}
            orders={orders}
            quickReplies={settings.liveChatQuickReplies}
            onReply={replyLiveChatAsAdmin}
            onUpdateStatus={updateLiveChatStatus}
            onUpdateMeta={updateLiveChatMeta}
            onMarkRead={markLiveChatReadByAdmin}
            onDeleteSession={deleteLiveChatSession}
            soundEnabled={settings.enableLiveChatSound !== false}
            isSoundMuted={isLiveChatSoundMuted}
            onToggleSoundMute={toggleAdminChatSoundMute}
            setToast={(t) => setToast({ show: t.show, type: t.type, message: t.message })}
          />
        )}
        </main>
      </div>
    </div>
  );
}
