import React, { useState, useEffect, useMemo } from 'react';
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
  Phone,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { Author, Banner, BookPreviewPage, Order, PaymentMethodConfig } from '../types';
import { DEFAULT_PAYMENT_METHODS } from '../firebase';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { compressImageFile, isValidImageUrl, sanitizeImageUrl } from '../utils/imageCompressor';
import { sortPaymentMethods, getPaymentMethodDisplayMeta } from '../utils/reviewHelpers';
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
  const { currentUser, isAdmin, loading: authLoading, signIn, logout, devLoginAsAdmin } = useAuth();
  const { 
    orders, 
    paymentSubmissions, 
    paymentMethods, 
    products, 
    banners,
    authors,
    settings, 
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
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
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
    deleteProductReview
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'payment-methods' | 'orders' | 'products' | 'categories' | 'banners' | 'authors' | 'subscribers' | 'settings' | 'special-offer' | 'reels' | 'reviews'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // New & Editing Payment Method modal state
  const [showAddPmModal, setShowAddPmModal] = useState(false);
  const [editingPmId, setEditingPmId] = useState<string | null>(null);
  const [pmName, setPmName] = useState('বিকাশ');
  const [pmEnglishName, setPmEnglishName] = useState('bKash');
  const [pmType, setPmType] = useState<'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'cod'>('bkash');
  const [pmSubtitle, setPmSubtitle] = useState('বিকাশ সেন্ড মানি');
  const [pmBadgeText, setPmBadgeText] = useState('');
  const [pmAccountType, setPmAccountType] = useState<'Personal' | 'Merchant' | 'Agent' | 'None'>('Personal');
  const [pmAccName, setPmAccName] = useState('MR. BOOKS Official');
  const [pmAccNum, setPmAccNum] = useState('');
  const [pmRequireTrxId, setPmRequireTrxId] = useState(true);
  const [pmRequireSenderPhone, setPmRequireSenderPhone] = useState(true);
  const [pmInst, setPmInst] = useState('');
  const [pmLogoUrl, setPmLogoUrl] = useState('');
  const [pmIsActive, setPmIsActive] = useState(true);

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
  const [settingsSubTab, setSettingsSubTab] = useState<'header' | 'footer' | 'shipping' | 'social' | 'seo'>('header');

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

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
  const [prodDeliveryEstimate, setProdDeliveryEstimate] = useState('2-3 Days');
  const [prodPublisher, setProdPublisher] = useState('');
  const [prodIsbn, setProdIsbn] = useState('');
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
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'book' | 'stationery'>('all');
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
    setPmIsActive(true);

    switch (template) {
      case 'bkash':
        setPmType('bkash');
        setPmName('বিকাশ');
        setPmEnglishName('bKash');
        setPmSubtitle('বিকাশ সেন্ড মানি');
        setPmAccountType('Personal');
        setPmAccName('MR. BOOKS Official');
        setPmAccNum('01712345678');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        setPmInst('বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।');
        break;
      case 'nagad':
        setPmType('nagad');
        setPmName('নগদ');
        setPmEnglishName('Nagad');
        setPmSubtitle('নগদ সেন্ড মানি');
        setPmAccountType('Personal');
        setPmAccName('MR. BOOKS BD');
        setPmAccNum('01812345678');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        setPmInst('নগদ অ্যাপ অথবা *167# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।');
        break;
      case 'rocket':
        setPmType('rocket');
        setPmName('রকেট');
        setPmEnglishName('Rocket');
        setPmSubtitle('রকেট সেন্ড মানি');
        setPmAccountType('Personal');
        setPmAccName('MR. BOOKS Account');
        setPmAccNum('019123456789');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        setPmInst('রকেট অ্যাপ অথবা *322# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।');
        break;
      case 'cod':
        setPmType('cod');
        setPmName('ক্যাশ অন ডেলিভারি');
        setPmEnglishName('Cash on Delivery');
        setPmSubtitle('হাতে পেয়ে মূল্য পরিশোধ');
        setPmAccountType('None');
        setPmAccName('Cash on Delivery');
        setPmAccNum('N/A');
        setPmRequireTrxId(false);
        setPmRequireSenderPhone(false);
        setPmInst('বই হাতে পেয়ে ডেলিভারি ম্যানের কাছে নগদ অর্থ পরিশোধ করুন।');
        break;
      case 'upay':
        setPmType('upay');
        setPmName('উপায়');
        setPmEnglishName('Upay');
        setPmSubtitle('উপায় সেন্ড মানি');
        setPmAccountType('Personal');
        setPmAccName('MR. BOOKS Official');
        setPmAccNum('01712345678');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        setPmInst('উপায় অ্যাপ অথবা *268# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি (TrxID) নিচে দিন।');
        break;
      case 'bank':
        setPmType('bank');
        setPmName('ব্যাংক ট্রান্সফার');
        setPmEnglishName('Bank Transfer');
        setPmSubtitle('ব্যাংক একাউন্টে পেমেন্ট');
        setPmAccountType('Merchant');
        setPmAccName('MR. BOOKS ENTERPRISE');
        setPmAccNum('123-110-456789');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        setPmInst('নির্ধারিত ব্যাংক একাউন্টে মোট টাকার পরিমাণ ট্রান্সফার করে ট্রানজেকশন রেফারেন্স বা রিসিপ্ট আইডি নিচে দিন।');
        break;
      case 'custom':
      default:
        setPmType('bkash');
        setPmName('');
        setPmEnglishName('');
        setPmSubtitle('');
        setPmAccountType('Personal');
        setPmAccName('MR. BOOKS');
        setPmAccNum('');
        setPmRequireTrxId(true);
        setPmRequireSenderPhone(true);
        setPmInst('');
        break;
    }

    setShowAddPmModal(true);
  };

  const openEditPmModal = (pm: PaymentMethodConfig) => {
    const meta = getPaymentMethodDisplayMeta(pm);
    setEditingPmId(pm.id);
    setPmType(pm.type);
    setPmName(meta.displayTitle);
    setPmEnglishName(meta.englishName);
    setPmSubtitle(meta.displaySubtitle);
    setPmBadgeText(meta.badgeText);
    setPmAccountType(meta.accountType);
    setPmAccName(pm.accountName || 'MR. BOOKS');
    setPmAccNum(pm.accountNumber || '');
    setPmRequireTrxId(meta.requireTrxId);
    setPmRequireSenderPhone(meta.requireSenderPhone);
    setPmInst(meta.instructionText);
    setPmLogoUrl(meta.customLogoUrl || '');
    setPmIsActive(pm.isActive);
    setShowAddPmModal(true);
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Partial<PaymentMethodConfig> = {
        name: pmName.trim() || 'পেমেন্ট মেথড',
        englishName: pmEnglishName.trim() || pmType.toUpperCase(),
        type: pmType,
        subtitle: pmSubtitle.trim(),
        badgeText: pmBadgeText.trim(),
        accountType: pmType === 'cod' ? 'None' : pmAccountType,
        accountName: pmAccName.trim() || 'MR. BOOKS',
        accountNumber: pmType === 'cod' ? 'N/A' : pmAccNum.trim(),
        requireTrxId: pmType === 'cod' ? false : pmRequireTrxId,
        requireSenderPhone: pmType === 'cod' ? false : pmRequireSenderPhone,
        instructions: pmInst.trim(),
        logoUrl: pmLogoUrl.trim() || '',
        isActive: pmIsActive,
      };

      if (editingPmId) {
        await updatePaymentMethod(editingPmId, payload);
        setToast({ show: true, type: 'success', message: 'Payment method updated and synced to Firestore!' });
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImg = prodImage.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
    const extraList = prodExtraImages
      ? prodExtraImages.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 5)
      : [];
    const allImages = Array.from(new Set([primaryImg, ...extraList]));

    const parsedVariants = prodPrintVariants
      ? prodPrintVariants.split(',').map((vName, idx) => ({
          id: `v${idx + 1}`,
          name: vName.trim(),
          price: prodPrice,
          stock: 100,
          sku: `MRB-VAR-${idx + 1}`
        })).filter(v => v.name.length > 0)
      : [{ id: 'v1', name: 'Paperback', price: prodPrice, stock: 100, sku: 'MRB-PB' }];

    const cleanedPreviewPages = sanitizePreviewPages(prodPreviewPages);

    const payload = {
      type: prodType,
      title: prodTitle,
      slug: prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description:
        prodDescription.trim() ||
        (prodType === 'book'
          ? 'Authentic book publication from MR. BOOKS.'
          : 'Premium stationery and office supply item.'),
      category: prodCategory,
      author: prodType === 'book' ? prodAuthor : (prodBrand || 'Stationery Brand'),
      publisher: prodType === 'book' ? (prodPublisher || 'MR. BOOKS Publications') : undefined,
      isbn: prodType === 'book' ? prodIsbn : undefined,
      brand: prodType === 'stationery' ? prodBrand : undefined,
      material: prodType === 'stationery' ? prodMaterial : undefined,
      dimensions: prodType === 'stationery' ? prodDimensions : undefined,
      colorModel: prodType === 'stationery' ? prodColorModel : undefined,
      images: allImages,
      price: prodPrice,
      previousPrice: prodPrice + 100,
      stock: 100,
      sku: (prodType === 'book' ? 'MRB-BK-' : 'MRB-ST-') + Math.floor(1000 + Math.random() * 9000),
      rating: 5.0,
      reviewCount: 1,
      isOriginalBadge: prodIsOriginal,
      deliveryEstimate: prodDeliveryEstimate,
      previewHighlightTitle: prodPreviewHighlightTitle.trim() || 'বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)',
      previewHighlightSubtitle: prodPreviewHighlightSubtitle.trim(),
      previewIntro: prodPreviewIntro.trim(),
      previewPages: cleanedPreviewPages,
      variants: parsedVariants.length > 0 ? parsedVariants : [
        { id: 'v1', name: prodType === 'book' ? 'Paperback' : 'Standard', price: prodPrice, stock: 100, sku: 'MRB-VAR-1' }
      ]
    };

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        setToast({
          show: true,
          type: 'success',
          message: 'বইয়ের তথ্য ও পেজ প্রিভিউ ফায়ারবেসে সেভ হয়েছে!',
        });
      } else {
        await addProduct(payload);
        setToast({
          show: true,
          type: 'success',
          message: 'নতুন বই ও পেজ প্রিভিউ সফলভাবে যুক্ত হয়েছে!',
        });
      }

      setEditingProductId(null);
      setProdTitle('');
      setProdAuthor('');
      setProdPublisher('');
      setProdIsbn('');
      setProdBrand('');
      setProdMaterial('');
      setProdDimensions('');
      setProdColorModel('');
      setProdDescription('');
      setProdPreviewHighlightTitle('বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)');
      setProdPreviewHighlightSubtitle('');
      setProdPreviewIntro('');
      setProdPreviewPages([]);
      setProdImage('');
      setProdExtraImages('');
      setProdPrintVariants('Paperback, Hardcover');
      setProdIsOriginal(true);
      setProdDeliveryEstimate('2-3 Days');
      setShowAddProdModal(false);
    } catch (err: any) {
      setToast({
        show: true,
        type: 'error',
        message: 'Firebase Error: ' + (err.message || 'Failed to save product'),
      });
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
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between selection:bg-[#D71920] selection:text-white font-sans antialiased">
        {/* Dedicated Admin Portal Top Bar */}
        <header className="border-b border-slate-800/80 bg-[#0E131F]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D71920] flex items-center justify-center text-white shadow-md shadow-[#D71920]/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">MR. BOOKS</span>
                <span className="text-[10px] font-bold bg-[#D71920]/20 text-[#FF4D4D] border border-[#D71920]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin OS
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Enterprise Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firebase Auth & Firestore: <strong className="text-white">mr-book-new</strong></span>
            </div>
            <button
              onClick={() => setActivePage('home')}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Storefront</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </header>

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
                  Restricted administrative console for <strong>MR. BOOKS</strong>. Please sign in with your configured administrator Firebase account.
                </p>
              </div>

              {/* Verified Identity Badge */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 text-left flex items-start gap-2.5 mt-2">
                <div className="p-1.5 bg-[#D71920]/15 text-[#FF4D4D] rounded-lg mt-0.5 shrink-0">
                  <Key size={14} />
                </div>
                <div className="text-[11px] leading-tight space-y-0.5">
                  <div className="text-slate-400">Configured Administrator:</div>
                  <div className="font-bold text-white">mr.booksbd700@gmail.com</div>
                  <div className="text-[10px] text-slate-500 font-mono">UID: ytewGIOO2uhISkUfUUwktSvzdjy1</div>
                </div>
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
                  placeholder="mr.booksbd700@gmail.com"
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

              <button
                type="button"
                data-testid="admin-dev-bypass-btn"
                onClick={() => devLoginAsAdmin?.()}
                className="w-full py-2.5 px-3 bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/60 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Quick Admin Sign In (Demo / Preview Access)</span>
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setActivePage('home')}
                className="text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
              >
                ← Back to Book Store
              </button>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Server size={11} className="text-emerald-500" />
                <span>Live Realtime Firestore</span>
              </div>
            </div>
          </div>
        </main>

        {/* Dedicated Admin Portal Footer */}
        <footer className="border-t border-slate-800/80 bg-[#0E131F]/90 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            MR. BOOKS Administrative Management System © {new Date().getFullYear()}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Direct Firestore Engine Connected
            </span>
          </div>
        </footer>
      </div>
    );
  }

  // 3. Unauthorized Customer Barrier (100% Standalone Page)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between selection:bg-[#D71920] selection:text-white font-sans antialiased">
        <header className="border-b border-slate-800/80 bg-[#0E131F]/90 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D71920] flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="font-black text-sm tracking-tight text-white">MR. BOOKS ADMIN OS</span>
          </div>
          <button
            onClick={() => setActivePage('home')}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Return to Store</span>
            <ExternalLink size={13} />
          </button>
        </header>

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

        <footer className="border-t border-slate-800/80 bg-[#0E131F]/90 px-4 sm:px-8 py-3 text-[11px] text-slate-500 text-center">
          MR. BOOKS Enterprise Security • Protected Area
        </footer>
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
        { id: 'reels', label: 'Book Video Reels', icon: Film, count: reels.length },
        { id: 'reviews', label: 'Reviews & Reactions', icon: Star, count: reviews.length },
      ]
    },
    {
      title: 'MARKETING & AUDIENCE',
      items: [
        { id: 'subscribers', label: 'VIP Subscribers', icon: Mail, count: subscribers.length },
      ]
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { id: 'settings', label: 'Store Settings', icon: Settings },
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
          {navSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 px-3 mb-1.5">
                {sec.title}
              </div>
              <div className="space-y-1">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
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
          ))}
        </div>
      </div>

      {/* Sidebar Footer User Card */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070A11] space-y-2">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#D71920] text-white font-black text-xs flex items-center justify-center shrink-0">
              A
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">mr.booksbd700</div>
              <div className="text-[10px] text-slate-400 truncate">Administrator</div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              setActivePage('home');
            }}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg cursor-pointer transition-colors shrink-0"
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#F4F6F8]">
        
        {/* Modern Top Header */}
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-400 hidden sm:inline">Admin Console</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-black text-slate-900 text-sm sm:text-base capitalize">
                {activeTab.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Firestore Sync: <code className="text-emerald-800 font-mono text-[11px]">mr-book-new</code></span>
            </div>

            {/* Storefront button */}
            <button
              onClick={() => setActivePage('home')}
              title="View Public Store"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Eye size={14} className="text-slate-500" />
              <span className="hidden sm:inline">Storefront</span>
            </button>

            {/* Sign Out button */}
            <button
              onClick={async () => {
                await logout();
                setActivePage('home');
              }}
              title="Logout Administrator"
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-red-50 hover:bg-red-100 text-[#D71920] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

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
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            
            {/* Top Banner Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/25 shadow-xs">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-black text-neutral-900">Payment Transactions</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">MFS & Digital Payment Tracking & Verification</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert('Payment transactions exported to CSV.')}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>CSV</span>
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw size={14} /> <span>Refresh</span>
                </button>
                <button 
                  onClick={() => alert('New manual payment logging modal triggered.')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Plus size={14} /> <span>New Payment</span>
                </button>
              </div>
            </div>

            {/* 4 Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Total Collected */}
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Total Collected</span>
                    <div className="text-2xl font-black text-neutral-900 mt-1">৳{paymentMetrics.totalCollected}</div>
                    <div className="text-xs font-bold text-emerald-600 mt-1">{paymentMetrics.completedCount} Completed</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <DollarSign size={20} />
                  </div>
                </div>
              </div>

              {/* Today Collected */}
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Today Collected</span>
                    <div className="text-2xl font-black text-[#D71920] mt-1">৳{paymentMetrics.totalCollected}</div>
                    <div className="text-xs font-bold text-neutral-500 mt-1">Today Collection</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#D71920] flex items-center justify-center border border-[#D71920]/25">
                    <TrendingUp size={20} />
                  </div>
                </div>
              </div>

              {/* Pending Payments */}
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">Pending Payments</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">{paymentMetrics.pendingCount}</div>
                    <div className="text-xs font-bold text-amber-600 mt-1">pending verification</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <Clock size={20} />
                  </div>
                </div>
              </div>

              {/* bKash & Other MFS */}
              <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider block">bKash & Other MFS</span>
                    <div className="text-xl font-black text-neutral-900 mt-1">৳{paymentMetrics.bkashTotal + paymentMetrics.nagadTotal}</div>
                    <div className="text-[11px] font-bold text-neutral-600 mt-1">bKash: ৳{paymentMetrics.bkashTotal} | Nagad: ৳{paymentMetrics.nagadTotal}</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center border border-pink-200">
                    <CreditCard size={20} />
                  </div>
                </div>
              </div>

            </div>

            {/* Search & Filter Toolbar Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs space-y-4">
              
              {/* Row 1: Search & Action Pills */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">🔍</span>
                  <input 
                    type="text"
                    placeholder="Search by TrxID, mobile, customer or order..."
                    value={paymentSearchQuery}
                    onChange={e => setPaymentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 text-xs font-bold border border-neutral-200 cursor-pointer">
                    ❌ Failed (0)
                  </button>
                  <button className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold border border-amber-200 cursor-pointer">
                    ⚠️ Flagged (0)
                  </button>
                </div>
              </div>

              {/* Row 2: Filter Pills (MFS Gateway & Status) */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: `All (${paymentSubmissions.length})` },
                    { id: 'bkash', label: 'bKash (0)' },
                    { id: 'nagad', label: 'Nagad (0)' },
                    { id: 'rocket', label: 'Rocket (0)' },
                    { id: 'upay', label: 'Upay (0)' },
                    { id: 'card', label: 'Card / Other (0)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentMfsFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentMfsFilter === tab.id ? 'bg-[#D71920] text-white shadow-xs' : 'bg-[#F7F7F8] text-neutral-700 hover:bg-neutral-200 border border-[#E5E5E5]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: `All (${paymentSubmissions.length})` },
                    { id: 'pending', label: `Pending (${paymentMetrics.pendingCount})` },
                    { id: 'paid', label: `Paid (${paymentMetrics.completedCount})` },
                    { id: 'failed', label: 'Failed (0)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentStatusFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentStatusFilter === tab.id ? 'bg-[#171717] text-white shadow-xs' : 'bg-[#F7F7F8] text-neutral-700 hover:bg-neutral-200 border border-[#E5E5E5]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Submissions Table */}
              {paymentSubmissions.length > 0 ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E5E5] bg-[#F7F7F8] text-[#5F6368] uppercase font-bold tracking-wider">
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3">Customer</th>
                        <th className="py-3 px-3">Provider</th>
                        <th className="py-3 px-3">TrxID Reference</th>
                        <th className="py-3 px-3">Amount</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Verification Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]">
                      {paymentSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-[#F7F7F8] transition-colors">
                          <td className="py-3.5 px-3 font-mono font-bold text-[#D71920]">{sub.orderId}</td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-[#171717]">{sub.customerName}</div>
                            <div className="text-[11px] text-[#5F6368]">{sub.customerPhone}</div>
                          </td>
                          <td className="py-3.5 px-3 font-medium">{sub.providerName}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-[#171717]">
                            <div>{sub.transactionReference}</div>
                            <div className="text-[10px] text-[#777777] font-normal">Sender: {sub.senderIdentifier}</div>
                          </td>
                          <td className="py-3.5 px-3 font-black text-[#171717]">৳{sub.claimedAmount}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              sub.status === 'rejected' ? 'bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/30' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {sub.status === 'pending_verification' && (
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => reviewPaymentSubmission(sub.id, 'approved')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <CheckCircle2 size={13} /> Approve
                                </button>
                                <button 
                                  onClick={() => setRejectingSubId(sub.id)}
                                  className="px-3 py-1 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              </div>
                            )}
                            {sub.status !== 'pending_verification' && (
                              <span className="text-[11px] text-[#777777]">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#777777] text-center py-8">No payment submissions pending verification.</p>
              )}

              {rejectingSubId && (
                <div className="p-5 bg-[#FFF1F2] rounded-2xl border border-[#D71920]/30 space-y-3 mt-4">
                  <h4 className="font-bold text-xs text-[#D71920] uppercase tracking-wider">
                    State Reason for Rejection
                  </h4>
                  <input 
                    type="text" 
                    placeholder="e.g. Transaction ID was not found in statement"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setRejectingSubId(null)} className="px-4 py-1.5 bg-white text-xs font-bold rounded-lg border border-[#E5E5E5] cursor-pointer">Cancel</button>
                    <button 
                      onClick={() => {
                        reviewPaymentSubmission(rejectingSubId, 'rejected', rejectReason);
                        setRejectingSubId(null);
                        setRejectReason('');
                      }}
                      className="px-4 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 3: PAYMENT METHODS CONFIGURATION */}
        {activeTab === 'payment-methods' && (
          <div className="space-y-5">
            {/* Top Header Banner Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 flex items-center justify-center shrink-0 shadow-2xs">
                  <CreditCard size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-lg sm:text-xl font-black text-[#171717]">
                      Payment Methods Configuration
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Firestore Synced
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6368] mt-1">
                    Manage bKash, Nagad, Rocket, Cash on Delivery, or configure new methods
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleResetPaymentMethodsToDefaults}
                  className="px-4 py-2.5 bg-[#F7F7F8] hover:bg-neutral-200/80 text-[#171717] border border-[#E5E5E5] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw size={14} className="text-[#5F6368]" />
                  <span>Reset to Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPmTemplateModal('custom')}
                  data-testid="add-payment-method-btn"
                  className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-[#D71920]/20 cursor-pointer transition-all"
                >
                  <Plus size={15} />
                  <span>Add Payment Method</span>
                </button>
              </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="bg-white border border-[#E5E5E5] rounded-2xl px-4 py-3.5 shadow-2xs flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5F6368] mr-1">
                <Sparkles size={14} className="text-[#D71920]" />
                <span>Quick Templates:</span>
              </div>

              {[
                { key: 'bkash', label: 'bKash', dotColor: 'bg-[#E2136E]' },
                { key: 'nagad', label: 'Nagad', dotColor: 'bg-[#F7941D]' },
                { key: 'rocket', label: 'Rocket', dotColor: 'bg-[#8C3494]' },
                { key: 'cod', label: 'Cash on Delivery', dotColor: 'bg-[#00A651]' },
                { key: 'upay', label: 'Upay', dotColor: 'bg-[#0054A6]' },
                { key: 'bank', label: 'Bank Transfer', dotColor: 'bg-[#1E3A8A]' },
              ].map(tpl => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => openPmTemplateModal(tpl.key as any)}
                  className="px-3 py-1.5 rounded-xl bg-[#F7F7F8] hover:bg-[#FFF1F2] text-[#171717] hover:text-[#D71920] border border-[#E5E5E5] hover:border-[#D71920]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus size={12} className="text-[#5F6368]" />
                  <span className={`w-2 h-2 rounded-full ${tpl.dotColor}`}></span>
                  <span>{tpl.label}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => openPmTemplateModal('custom')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF1F2] text-[#5F6368] hover:text-[#D71920] border border-dashed border-neutral-300 hover:border-[#D71920]/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus size={12} />
                <span>Custom Payment Method</span>
              </button>
            </div>

            {/* Serial Payment Methods List */}
            <div className="space-y-3" data-testid="admin-payment-methods-list">
              {sortPaymentMethods(paymentMethods).map((pm, idx, arr) => {
                const meta = getPaymentMethodDisplayMeta(pm);
                const showAccountLine =
                  pm.type !== 'cod' && pm.accountNumber && pm.accountNumber !== 'N/A';

                return (
                  <div
                    key={pm.id}
                    data-testid={`admin-pm-row-${pm.type}`}
                    className="bg-white hover:bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#D71920]/30 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Reorder Arrows + Brand Icon + Method Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Up / Down Serial Reorder Buttons */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePaymentMethod(idx, 'up')}
                          title="Move Up"
                          className="p-1 rounded-lg border border-[#E5E5E5] bg-[#F7F7F8] hover:bg-[#FFF1F2] hover:text-[#D71920] hover:border-[#D71920]/30 text-neutral-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMovePaymentMethod(idx, 'down')}
                          title="Move Down"
                          className="p-1 rounded-lg border border-[#E5E5E5] bg-[#F7F7F8] hover:bg-[#FFF1F2] hover:text-[#D71920] hover:border-[#D71920]/30 text-neutral-500 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {/* Brand Icon */}
                      <PaymentBrandIcon method={pm} size="lg" />

                      {/* Center Details */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        {/* Line 1: Title + English Name + Status & Config Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-sm sm:text-base text-[#171717]">
                            {meta.displayTitle}{' '}
                            <span className="font-bold text-[#5F6368]">
                              ({meta.englishName})
                            </span>
                          </h3>

                          {/* Active / Inactive Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              pm.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                            }`}
                          >
                            {pm.isActive ? 'Active' : 'Inactive'}
                          </span>

                          {/* Account Type Pill (Personal / Merchant / Agent) */}
                          {meta.accountType !== 'None' && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/20 text-[10px] font-bold">
                              {meta.accountType}
                            </span>
                          )}

                          {/* Optional Promo Offer Badge (Only shown when configured by Admin!) */}
                          {meta.badgeText && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black flex items-center gap-1">
                              <span>🔥</span>
                              <span>{meta.badgeText}</span>
                            </span>
                          )}

                          {/* Requirement Pills */}
                          {meta.requireTrxId && (
                            <span className="px-2 py-0.5 rounded-md bg-[#F7F7F8] text-[#5F6368] border border-[#E5E5E5] text-[10px] font-bold">
                              TrxID
                            </span>
                          )}
                          {meta.requireSenderPhone && (
                            <span className="px-2 py-0.5 rounded-md bg-[#F7F7F8] text-[#5F6368] border border-[#E5E5E5] text-[10px] font-bold">
                              Sender Phone
                            </span>
                          )}
                        </div>

                        {/* Line 2: Account Number & Subtitle */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6368]">
                          {showAccountLine && (
                            <>
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-[#D71920] bg-[#FFF1F2] px-2 py-0.5 rounded-md border border-[#D71920]/15">
                                <Phone size={11} />
                                <span>{pm.accountNumber}</span>
                              </span>
                              <span className="text-neutral-300">•</span>
                            </>
                          )}
                          <span className="font-semibold text-[#5F6368]">
                            {meta.displaySubtitle}
                          </span>
                        </div>

                        {/* Line 3: Instructions Preview */}
                        <div className="text-[11px] text-[#5F6368] italic bg-[#F7F7F8] px-3 py-1.5 rounded-xl border border-[#EEEEEE] truncate">
                          <span className="font-semibold not-italic text-[#171717]">
                            Instructions:{' '}
                          </span>
                          {meta.instructionText}
                        </div>
                      </div>
                    </div>

                    {/* Right: Active Toggle + Edit Modal Trigger + Delete */}
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EEEEEE]">
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-all ${
                          pm.isActive
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-[#F7F7F8] hover:bg-neutral-200 text-neutral-600 border-[#E5E5E5]'
                        }`}
                      >
                        <Check size={13} className={pm.isActive ? 'text-emerald-600' : 'text-neutral-400'} />
                        <span>{pm.isActive ? 'Active' : 'Inactive'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditPmModal(pm)}
                        data-testid={`edit-pm-${pm.type}`}
                        title="Edit Payment Method & Offer Badge"
                        className="p-2.5 rounded-xl bg-[#F7F7F8] hover:bg-[#FFF1F2] text-[#171717] hover:text-[#D71920] border border-[#E5E5E5] hover:border-[#D71920]/30 cursor-pointer transition-colors"
                      >
                        <Edit2 size={15} />
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
                        className="p-2.5 rounded-xl bg-red-50/70 hover:bg-red-100 text-[#D71920] border border-red-200/60 cursor-pointer transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
                          <option value="bank">Bank Transfer (ব্যাংক)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Account Type Badge
                        </label>
                        <select
                          value={pmAccountType}
                          onChange={e => setPmAccountType(e.target.value as any)}
                          disabled={pmType === 'cod'}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] font-bold text-[#171717] disabled:opacity-50 focus:outline-none focus:border-[#D71920]"
                        >
                          <option value="Personal">Personal</option>
                          <option value="Merchant">Merchant</option>
                          <option value="Agent">Agent</option>
                          <option value="None">None</option>
                        </select>
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

                    {/* Row 3: Account Number & Subtitle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Account / Wallet Number {pmType !== 'cod' ? '*' : ''}
                        </label>
                        <input
                          type="text"
                          required={pmType !== 'cod'}
                          disabled={pmType === 'cod'}
                          placeholder={pmType === 'cod' ? 'N/A' : '017XXXXXXXX'}
                          value={pmType === 'cod' ? 'N/A' : pmAccNum}
                          onChange={e => setPmAccNum(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white font-mono font-bold text-[#171717] disabled:bg-neutral-100 focus:outline-none focus:border-[#D71920]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                          Subtitle (সাবটাইটেল)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. বিকাশ সেন্ড মানি"
                          value={pmSubtitle}
                          onChange={e => setPmSubtitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-[#171717] focus:outline-none focus:border-[#D71920]"
                        />
                      </div>
                    </div>

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
                      <p className="text-[10px] text-[#5F6368]">
                        If left blank, no offer badge will be shown on the checkout card.
                      </p>
                    </div>

                    {/* Row 5: Verification Checkboxes */}
                    {pmType !== 'cod' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5]">
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

                    {/* Row 6: Custom Brand Icon / Logo Upload */}
                    <div className="p-3.5 rounded-2xl bg-[#F7F7F8] border border-[#E5E5E5] space-y-2.5">
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
                            Remove Custom Icon (Use Default Vector)
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
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
                          size="lg"
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Custom Icon URL (leave blank for built-in vector icon)"
                            value={isValidImageUrl(pmLogoUrl) ? pmLogoUrl : ''}
                            onChange={e => setPmLogoUrl(sanitizeImageUrl(e.target.value))}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717] focus:outline-none focus:border-[#D71920]"
                          />
                          <label className="px-3.5 py-2 bg-[#FFF1F2] hover:bg-[#D71920] text-[#D71920] hover:text-white font-bold rounded-xl border border-[#D71920]/30 text-xs cursor-pointer transition-all shrink-0 flex items-center gap-1.5">
                            <Upload size={13} />
                            <span>Upload</span>
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

                    {/* Row 7: Popup Instructions */}
                    <div>
                      <label className="block font-bold text-[#171717] uppercase tracking-wider text-[10px] mb-1">
                        Payment Instructions (পেমেন্ট নির্দেশনা) *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="বিকাশ অ্যাপ অথবা *247# ডায়াল করে নির্ধারিত নম্বরে Send Money করুন..."
                        value={pmInst}
                        onChange={e => setPmInst(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-[#171717] focus:outline-none focus:border-[#D71920]"
                      />
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
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717]">Special Offer Banner & Deal Manager</h2>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  Configure homepage special offer countdown deals, discount percentages, sold progress, and online payment requirements.
                </p>
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
                className="px-5 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check size={14} /> <span>{settingsSaving ? 'Saving...' : 'Save Special Offer'}</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Enable & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F7F7F8] border border-neutral-200">
                <div className="flex items-center justify-between sm:border-r sm:border-neutral-200 sm:pr-4">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900">Enable Special Offer Section</h4>
                    <p className="text-[11px] text-neutral-500">Showcases special offer banner on homepage</p>
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
                    className="w-5 h-5 accent-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1 text-xs">Section Heading Title</label>
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
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                  />
                </div>
              </div>

              {/* Offer Products List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs text-neutral-800 uppercase tracking-wider">
                    Featured Offer Products ({settingsForm.specialOffer?.items?.length || 0})
                  </h3>
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
                    className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-neutral-800"
                  >
                    <Plus size={13} /> Add Offer Product
                  </button>
                </div>

                <div className="space-y-3">
                  {(settingsForm.specialOffer?.items || []).map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="p-4 rounded-2xl border border-neutral-200 bg-[#F7F7F8] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-4 flex items-center gap-3">
                          <img src={prod?.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} alt="" className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
                          <div className="min-w-0">
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
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.title} (৳{p.price})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase">Discount %</label>
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
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase">Sold %</label>
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
                            className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-bold text-neutral-900"
                          />
                        </div>

                        <div className="md:col-span-3 flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 cursor-pointer pt-3">
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
                              className="w-4 h-4 accent-blue-600"
                            />
                            <span>Online Payment Only</span>
                          </label>
                        </div>

                        <div className="md:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSettingsForm(prev => {
                                const items = (prev.specialOffer?.items || []).filter((_, i) => i !== idx);
                                return { ...prev, specialOffer: { ...prev.specialOffer!, items } };
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Remove Product"
                          >
                            <Trash2 size={16} />
                          </button>
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
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Unified & Compact Order Filter & Search Toolbar */}
            <div className="bg-[#F7F7F8] border border-[#E5E5E5] rounded-2xl p-4 space-y-3 shadow-xs">
              
              {/* Row 1: Search & Main Action Buttons (Create Order, Sync) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">🔍</span>
                  <input 
                    type="text"
                    placeholder="Search orders by ID, customer name, phone, or address..."
                    value={orderSearchQuery}
                    onChange={e => setOrderSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => alert('Create Order modal triggered.')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Plus size={13} /> <span>Create Order</span>
                  </button>

                  <button 
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <RefreshCw size={13} /> <span>Sync</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Compact Dropdown Filters (Status, Dates, Channels, Payments, Verification) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-[#E5E5E5] pt-3">
                <select 
                  value={orderStatusFilter} 
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                >
                  <option value="all">⚡ All Status ({orders.length})</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="processing">⚙️ Processing</option>
                  <option value="shipped">🚚 Shipped</option>
                  <option value="delivered">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>

                <select className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]">
                  <option value="all">📅 All Dates</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>

                <select className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]">
                  <option value="all">🌐 All Channels</option>
                  <option value="web">Website Store</option>
                  <option value="phone">Phone Order</option>
                </select>

                <select className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]">
                  <option value="all">💳 All Payments</option>
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>

                <select className="px-3.5 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920] col-span-2 sm:col-span-1">
                  <option value="all">🛡️ Verification (All)</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Row 3: Status Pill Quick Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { id: 'all', label: `All Orders (${orders.length})` },
                  { id: 'pending', label: `Pending (${orders.filter(o => o.orderStatus === 'pending').length})` },
                  { id: 'processing', label: `Processing (${orders.filter(o => o.orderStatus === 'processing').length})` },
                  { id: 'shipped', label: `Shipped (${orders.filter(o => o.orderStatus === 'shipped').length})` },
                  { id: 'delivered', label: `Completed (${orders.filter(o => o.orderStatus === 'delivered').length})` },
                  { id: 'cancelled', label: `Cancelled (${orders.filter(o => o.orderStatus === 'cancelled').length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderStatusFilter === tab.id ? 'bg-[#D71920] text-white shadow-xs' : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-[#E5E5E5]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Cards List */}
            <div className="space-y-4">
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
                  <div key={o.id} className="bg-white border border-[#E5E5E5] hover:border-[#D71920]/60 rounded-3xl p-5 shadow-xs space-y-4 transition-all">
                    
                    {/* Order Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0F0]">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input type="checkbox" className="accent-[#D71920] rounded" />
                        <span className="font-black text-sm text-[#D71920] font-mono">#{o.id}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920] text-[10px] font-black uppercase border border-[#D71920]/25">
                          Verified Order
                        </span>
                        <span className="text-xs font-bold text-neutral-500 flex items-center gap-1">
                          <Calendar size={13} /> {new Date(o.createdAt).toLocaleString()}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                          {o.district.toLowerCase().includes('dhaka') ? 'Inside Dhaka' : 'Outside Dhaka'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select 
                          value={o.orderStatus}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer ${
                            o.orderStatus === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            o.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="confirmed">👍 Confirmed</option>
                          <option value="processing">⚙️ Processing</option>
                          <option value="shipped">🚚 Shipped</option>
                          <option value="delivered">✅ Delivered</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Card Body */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      
                      {/* Customer Info (4 cols) */}
                      <div className="lg:col-span-4 space-y-1.5">
                        <div className="font-black text-sm text-neutral-900 flex items-center gap-1.5">
                          <span>👤 {o.customerName}</span>
                        </div>
                        <div className="text-xs font-bold text-neutral-700 flex items-center gap-1.5 flex-wrap">
                          <span>📞 {o.phone}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">WA</span>
                          {o.optionalPhone && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                              📱 Alt: {o.optionalPhone}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-600 line-clamp-2">
                          📍 {o.address}, {o.city}, {o.district}
                        </div>
                        {o.notes && (
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold mt-1">
                            💬 NOTE: {o.notes}
                          </div>
                        )}
                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                          <span>🛡️ Fraud Analysis: 0 Cancelled (1 total)</span>
                        </div>
                      </div>

                      {/* Items Ordered (4 cols) */}
                      <div className="lg:col-span-4 space-y-2 bg-[#F7F7F8] p-3 rounded-2xl border border-[#E5E5E5]">
                        <div className="text-[11px] font-black uppercase text-neutral-500">
                          {o.items.length} item(s) ordered
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {o.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-neutral-200">
                              <img src={item.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'} alt="" className="w-9 h-9 object-cover rounded-lg border border-neutral-200 shrink-0" />
                              <div className="flex-1 min-w-0 text-xs">
                                <div className="font-black text-neutral-900 truncate">{item.title}</div>
                                <div className="text-[11px] text-neutral-500">Qty: {item.quantity} · ৳{item.price} each</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals, Payment & Actions (4 cols) */}
                      <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between bg-[#FFF1F2] p-3 rounded-2xl border border-[#D71920]/20">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-500 block">Total Amount</span>
                            <div className="text-lg font-black text-[#D71920]">৳{o.total}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">Delivery: ৳{o.deliveryCharge}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 uppercase block">
                              {o.paymentMethodName || 'Cash on Delivery'}
                            </span>
                            <select
                              value={o.paymentStatus}
                              onChange={(e) => updateOrderPaymentStatus(o.id, e.target.value as any)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase cursor-pointer ${
                                o.paymentStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                o.paymentStatus === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                                o.paymentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="pending_verification">Pending Verification</option>
                              <option value="approved">Paid / Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>

                        {/* Courier & Live Tracking Management */}
                        <div className="space-y-2 pt-1 border-t border-neutral-100">
                          {o.courierName || o.trackingCode ? (
                            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2 text-xs flex items-center justify-between">
                              <div className="min-w-0">
                                <span className="font-extrabold text-amber-900 block truncate">
                                  🚚 {o.courierName || 'Courier'}: {o.trackingCode || 'Dispatched'}
                                </span>
                                {o.trackingNotes && (
                                  <span className="text-[10px] text-amber-700 block truncate">{o.trackingNotes}</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setTrackingModalOrder(o);
                                  setCourierNameInput(o.courierName || 'Steadfast');
                                  setTrackingCodeInput(o.trackingCode || '');
                                  setTrackingUrlInput(o.trackingUrl || '');
                                  setTrackingNotesInput(o.trackingNotes || '');
                                  setTrackingStatusInput(o.orderStatus);
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          ) : null}

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
                              className="flex-1 py-1.5 px-3 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                            >
                              <Truck size={13} className="text-[#D71920]" />
                              <span>{o.courierName || o.trackingCode ? 'Manage Tracking' : 'Assign Courier'}</span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => alert(`Order ID: ${o.id}\nCustomer: ${o.customerName}\nPhone: ${o.phone}${o.optionalPhone ? `\nOptional Phone: ${o.optionalPhone}` : ''}\nAddress: ${o.address}, ${o.city}\nTotal: ৳${o.total}\nPayment: ${o.paymentMethodName || 'COD'} (${o.paymentStatus})`)} className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer" title="View Details">
                                👁️
                              </button>
                              <button onClick={() => window.print()} className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer" title="Print Invoice">
                                🖨️
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete order #${o.id}? This will permanently remove the fake or unwanted order.`)) {
                                    try {
                                      await deleteOrder(o.id);
                                      setToast({ show: true, type: 'success', message: `Order #${o.id} successfully deleted.` });
                                    } catch (err: any) {
                                      setToast({ show: true, type: 'error', message: `Failed to delete order: ${err.message}` });
                                    }
                                  }
                                }} 
                                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-[#D71920] cursor-pointer transition-colors" 
                                title="Delete Order (Remove Fake/Unwanted)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                ))}
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
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717]">Books & Stationery Inventory</h2>
                <p className="text-xs text-[#5F6368] mt-1">Manage catalog items, add new books with author/publisher details, or stationery with brand/material specifications.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingProductId(null);
                  setProdTitle('');
                  setProdType('book');
                  setProdPrice(350);
                  setProdCategory(categories[0]?.name || 'Fiction & Literature');
                  setProdAuthor('');
                  setProdPublisher('');
                  setProdIsbn('');
                  setProdBrand('');
                  setProdMaterial('');
                  setProdDimensions('');
                  setProdColorModel('');
                  setProdDescription('');
                  setProdPreviewHighlightTitle('বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)');
                  setProdPreviewHighlightSubtitle('');
                  setProdPreviewIntro('');
                  setProdPreviewPages([]);
                  setProdImage('');
                  setProdExtraImages('');
                  setProdPrintVariants('Paperback, Hardcover');
                  setProdIsOriginal(true);
                  setProdDeliveryEstimate('2-3 Days');
                  setShowAddProdModal(true);
                }}
                className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {/* Inventory Filter Pills */}
            <div className="flex items-center gap-2 bg-[#F7F7F8] p-1.5 rounded-2xl w-fit border border-[#E5E5E5]">
              {[
                { id: 'all', label: `All Products (${products.length})` },
                { id: 'book', label: `Books (${products.filter(p => p.type === 'book').length})` },
                { id: 'stationery', label: `Stationery (${products.filter(p => p.type === 'stationery').length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setInventoryFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inventoryFilter === tab.id ? 'bg-[#D71920] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter(p => inventoryFilter === 'all' || p.type === inventoryFilter)
                .map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] flex items-center gap-3.5">
                  <img src={p.images[0]} alt="" className="w-14 h-18 object-contain bg-white rounded-lg p-1 border border-[#E5E5E5]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        p.type === 'book' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.type === 'book' ? '📚 Book' : '✏️ Stationery'}
                      </span>
                      {p.previewPages && p.previewPages.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/25">
                          📖 {p.previewPages.length} Pages
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-[#171717] truncate mt-1">{p.title}</h4>
                    <p className="text-xs font-black text-[#171717] mt-0.5">৳{p.price}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button 
                        onClick={() => {
                          setEditingProductId(p.id);
                          setProdTitle(p.title);
                          setProdType(p.type);
                          setProdPrice(p.price);
                          setProdCategory(p.category);
                          setProdAuthor(p.author || '');
                          setProdPublisher((p as any).publisher || '');
                          setProdIsbn((p as any).isbn || '');
                          setProdBrand((p as any).brand || p.author || '');
                          setProdMaterial((p as any).material || '');
                          setProdDimensions((p as any).dimensions || '');
                          setProdColorModel((p as any).colorModel || '');
                          setProdDescription(p.description || '');
                          setProdPreviewHighlightTitle(p.previewHighlightTitle || 'বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)');
                          setProdPreviewHighlightSubtitle(p.previewHighlightSubtitle || '');
                          setProdPreviewIntro(p.previewIntro || '');
                          setProdPreviewPages(sanitizePreviewPages(p.previewPages));
                          setProdImage(p.images[0] || '');
                          setProdExtraImages(p.images.slice(1).join(', '));
                          setProdIsOriginal(p.isOriginalBadge !== false);
                          setProdPrintVariants(p.variants ? p.variants.map(v => v.name).join(', ') : 'Paperback, Hardcover');
                          setProdDeliveryEstimate(p.deliveryEstimate || '2-3 Days');
                          setShowAddProdModal(true);
                        }}
                        className="text-[11px] text-[#171717] hover:text-[#D71920] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} /> Edit / 📖 প্রিভিউ পেজ
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showAddProdModal && (
              <form onSubmit={handleCreateProduct} className="p-6 bg-[#F7F7F8] rounded-3xl border border-[#E5E5E5] space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                  <h3 className="font-black text-sm text-[#171717]">
                    {editingProductId ? 'Edit Catalog Item & Book Preview Pages' : 'Add New Item (Book or Stationery)'}
                  </h3>
                  <button type="button" onClick={() => setShowAddProdModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold cursor-pointer">✕</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Item Title</label>
                    <input type="text" placeholder="e.g. Paradoxical Sajid / Faber Castell Pencil" required value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Catalog Type</label>
                    <select value={prodType} onChange={e => setProdType(e.target.value as any)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717]">
                      <option value="book">📚 Book (Literature / Text)</option>
                      <option value="stationery">✏️ Stationery & Office Supply</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Category</label>
                    <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]">
                      {categories
                        .filter(c => c.type === prodType)
                        .map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Price (BDT)</label>
                    <input type="number" placeholder="350" required value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Delivery Estimate</label>
                    <input type="text" placeholder="e.g. 2-3 Days" value={prodDeliveryEstimate} onChange={e => setProdDeliveryEstimate(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  </div>
                </div>

                {/* TAILORED FIELDS: BOOK VS STATIONERY */}
                {prodType === 'book' ? (
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-3">
                    <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <span>📚 Book Specific Attributes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Author Name *</label>
                        <input type="text" placeholder="e.g. Humayun Ahmed" required value={prodAuthor} onChange={e => setProdAuthor(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Publisher</label>
                        <input type="text" placeholder="e.g. Prothoma Publications" value={prodPublisher} onChange={e => setProdPublisher(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">ISBN Code</label>
                        <input type="text" placeholder="e.g. 978984..." value={prodIsbn} onChange={e => setProdIsbn(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 space-y-3">
                    <div className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <span>✏️ Stationery & Office Supply Attributes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Brand / Manufacturer *</label>
                        <input type="text" placeholder="e.g. Faber-Castell / Deli" required value={prodBrand} onChange={e => setProdBrand(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Material</label>
                        <input type="text" placeholder="e.g. Plastic / Wood / Metal" value={prodMaterial} onChange={e => setProdMaterial(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Dimensions / Size</label>
                        <input type="text" placeholder="e.g. A4 / 0.5mm / 30cm" value={prodDimensions} onChange={e => setProdDimensions(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Color / Model</label>
                        <input type="text" placeholder="e.g. Blue / Matte Black" value={prodColorModel} onChange={e => setProdColorModel(e.target.value)} className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-xs" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Book Overview / Description */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    Book / Item Description (Overview):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Write general overview or summary about this book..."
                    value={prodDescription}
                    onChange={e => setProdDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                  />
                </div>

                {/* ===================================================================== */}
                {/* BOOK PREVIEW & PDF / PAGE SLIDER MANAGER ("বইয়ের কিছু অংশ পড়ুন")       */}
                {/* ===================================================================== */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FFF5F5] via-white to-[#FFF9F5] border-2 border-[#D71920]/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D71920]/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[#D71920]" />
                        <span className="font-black text-xs sm:text-sm text-[#D71920]">
                          বইয়ের কিছু অংশ পড়ুন — Book Preview, Text & PDF Pages Slider
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        এখানে বই সম্পর্কে কিছু লিখুন অথবা PDF ফাইল / ২-৩টি পৃষ্ঠার ছবি বা লেখা যুক্ত করুন। কাস্টমার স্লাইড করে বইয়ের পাতা উল্টে পড়তে পারবে।
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* 1. Upload PDF File (Auto-extracts 2-5 pages) */}
                      <label className="px-3 py-1.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                        <Upload size={12} />
                        <span>{pdfUploading ? 'প্রসেস হচ্ছে...' : 'Upload PDF (২-৫ পেজ)'}</span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleBookPdfUpload}
                          disabled={pdfUploading}
                          className="hidden"
                        />
                      </label>

                      {/* 2. Upload Page Images (Multiple PNG/JPG) */}
                      <label className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all">
                        <ImageIcon size={12} />
                        <span>Upload Page Images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleBookPagesImageUpload}
                          disabled={pdfUploading}
                          className="hidden"
                        />
                      </label>

                      {/* 3. Add Written Book Page */}
                      <button
                        type="button"
                        onClick={handleAddWrittenPreviewPage}
                        className="px-3 py-1.5 bg-white hover:bg-[#FFF1F2] text-[#D71920] border border-[#D71920]/40 rounded-xl font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                      >
                        <Plus size={12} />
                        <span>লেখার পৃষ্ঠা যোগ করুন</span>
                      </button>
                    </div>
                  </div>

                  {/* Highlight Callout Title & "বই সম্পর্কে কিছু লেখা" */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        হাইলাইট শিরোনাম (Highlighted Section Title)
                      </label>
                      <input
                        type="text"
                        placeholder="বইয়ের কিছু অংশ পড়ুন (একটু পড়ে দেখুন)"
                        value={prodPreviewHighlightTitle}
                        onChange={e => setProdPreviewHighlightTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-bold text-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        সাব-টাইটেল (Optional Highlight Subtitle)
                      </label>
                      <input
                        type="text"
                        placeholder="বইয়ের কিছুটা পড়তে পারেন এখানে • পৃষ্ঠা স্লাইড করে পড়ুন"
                        value={prodPreviewHighlightSubtitle}
                        onChange={e => setProdPreviewHighlightSubtitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">
                        বই সম্পর্কে কিছু কথা / ভূমিকা (Shown Inside Book Preview)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="বইটি সম্পর্কে বিশেষ কিছু কথা বা ভূমিকা লিখুন যা কাস্টমার পেজ ওপেন করলেই দেখতে পাবে..."
                        value={prodPreviewIntro}
                        onChange={e => setProdPreviewIntro(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-900"
                      />
                    </div>
                  </div>

                  {/* Configured Book Pages List */}
                  {prodPreviewPages.length > 0 ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                        <span>যুক্ত করা বইয়ের পৃষ্ঠাসমূহ ({prodPreviewPages.length}টি পৃষ্ঠা):</span>
                        <button
                          type="button"
                          onClick={() => setProdPreviewPages([])}
                          className="text-red-600 hover:underline cursor-pointer text-[10px] font-bold"
                        >
                          সব পৃষ্ঠা মুছুন (Clear All Pages)
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                        {prodPreviewPages.map((pg, idx) => (
                          <div
                            key={pg.id || idx}
                            className="p-3 rounded-2xl bg-white border border-neutral-200 shadow-2xs space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-neutral-100">
                              <span className="font-black text-[#D71920] flex items-center gap-1">
                                <FileText size={12} />
                                <span>পৃষ্ঠা {toBanglaDigits(idx + 1)}</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => setProdPreviewPages(prev => movePreviewPage(prev, idx, 'up'))}
                                  className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
                                  title="Move Page Up"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === prodPreviewPages.length - 1}
                                  onClick={() => setProdPreviewPages(prev => movePreviewPage(prev, idx, 'down'))}
                                  className="p-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
                                  title="Move Page Down"
                                >
                                  <ArrowDown size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProdPreviewPages(prev =>
                                      prev
                                        .filter((_, i) => i !== idx)
                                        .map((item, i) => ({ ...item, pageNumber: i + 1 }))
                                    )
                                  }
                                  className="p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                                  title="Delete Page"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder={`পৃষ্ঠা ${toBanglaDigits(idx + 1)} শিরোনাম (যেমন: প্রথম অধ্যায়)`}
                              value={pg.title || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setProdPreviewPages(prev =>
                                  prev.map((item, i) => (i === idx ? { ...item, title: val } : item))
                                );
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 font-bold text-neutral-800 text-[11px]"
                            />

                            {isValidImageUrl(pg.imageUrl) && (
                              <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 p-1.5 flex items-center gap-2.5">
                                <img
                                  src={pg.imageUrl}
                                  alt={pg.title || `Page ${idx + 1}`}
                                  className="w-14 h-20 object-contain bg-white rounded border border-neutral-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0 space-y-1">
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                    ✓ Page Image / PDF Page Attached
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setProdPreviewPages(prev =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, imageUrl: undefined } : item
                                        )
                                      )
                                    }
                                    className="block text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
                                  >
                                    ছবি পরিবর্তন / মুছুন
                                  </button>
                                </div>
                              </div>
                            )}

                            <textarea
                              rows={3}
                              placeholder="এই পৃষ্ঠার লেখা বা বইয়ের অংশ এখানে লিখুন (ঐচ্ছিক যদি ছবি দেওয়া থাকে)..."
                              value={pg.content || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setProdPreviewPages(prev =>
                                  prev.map((item, i) => (i === idx ? { ...item, content: val } : item))
                                );
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-800 text-[11px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white/80 border border-dashed border-[#D71920]/30 text-center text-[11px] text-neutral-600">
                      এখনো কোনো কাস্টম পৃষ্ঠা যোগ করা হয়নি। উপরে <strong>Upload PDF</strong>, <strong>Upload Page Images</strong> বা <strong>লেখার পৃষ্ঠা যোগ করুন</strong> বাটনে ক্লিক করে ২-৩টি বা তার বেশি পৃষ্ঠা যুক্ত করতে পারেন।
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    Main Photo URL:
                  </label>
                  <input type="url" placeholder="Cover Image URL (https://...)" value={prodImage} onChange={e => setProdImage(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    {prodType === 'book' ? 'Book Print Editions / Formats:' : 'Item Variants / Pack Sizes:'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={prodType === 'book' ? 'Paperback, Hardcover' : 'Single Piece, Pack of 5, Box of 12'} 
                    value={prodPrintVariants} 
                    onChange={e => setProdPrintVariants(e.target.value)} 
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                  />
                </div>

                {prodType === 'book' && (
                  <div className="flex items-center gap-2 pt-1 pb-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={prodIsOriginal} 
                        onChange={e => setProdIsOriginal(e.target.checked)} 
                        className="w-4 h-4 text-[#D71920] accent-[#D71920] rounded cursor-pointer"
                      />
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                        <ShieldCheck size={14} className="text-emerald-600" /> Show "অরিজিনাল বই" (Original Book Verified Badge)
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowAddProdModal(false)} className="px-4 py-2 bg-white text-xs font-bold rounded-xl border border-[#E5E5E5] cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-[#D71920] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#B9151B]">Save Product</button>
                </div>
              </form>
            )}
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
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <Users size={20} className="text-[#D71920]" /> Writers & Author Profiles
                </h2>
                <p className="text-xs text-[#5F6368] mt-1">
                  Add and manage author profiles, books count, biographies, and author profile pictures.
                </p>
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
                className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add New Author
              </button>
            </div>

            {/* Authors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {authors.map(author => (
                <div key={author.id} className="p-4 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] flex items-center gap-3.5 shadow-2xs group">
                  {/* Author Profile Picture */}
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs bg-[#FFF1F2] flex items-center justify-center">
                    {author.photoUrl ? (
                      <img 
                        src={author.photoUrl} 
                        alt={author.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-[#D71920] font-black text-lg">{author.name[0]}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#171717] truncate">{author.name}</h4>
                    <p className="text-xs text-[#5F6368] mt-0.5">{author.booksCount || 10}+ Books Published</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => {
                          setEditingAuthorId(author.id);
                          setAuthorName(author.name);
                          setAuthorBio(author.bio || '');
                          setAuthorPhoto(author.photoUrl || '');
                          setAuthorBooksCount(author.booksCount || 20);
                          setShowAddAuthorModal(true);
                        }}
                        className="text-[11px] text-[#171717] hover:text-[#D71920] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button 
                        onClick={() => deleteAuthor(author.id)}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
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

        {/* TAB: SUBSCRIBERS AUDIENCE MANAGEMENT */}
        {activeTab === 'subscribers' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <Mail size={22} className="text-[#D71920]" /> VIP Club & Discount Subscribers
                </h2>
                <p className="text-xs text-[#5F6368] mt-1">
                  Manage all phone numbers and emails collected from the website footer subscription box for marketing campaigns and discounts.
                </p>
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
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-300"
                >
                  {copiedSubs ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedSubs ? 'Copied to Clipboard!' : 'Copy All Subscribers'}</span>
                </button>

                <button
                  onClick={() => {
                    setNewSubInput('');
                    setNewSubMsg(null);
                    setShowAddSubModal(true);
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Subscriber</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#F7F7F8] p-4 rounded-2xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Total Subscribers</span>
                <div className="text-2xl font-black text-neutral-900 mt-1">{subscribers.length}</div>
                <span className="text-[11px] text-emerald-600 font-bold mt-1 block">● 100% Active in Audience</span>
              </div>

              <div className="bg-[#F7F7F8] p-4 rounded-2xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Mobile Subscribers</span>
                <div className="text-2xl font-black text-[#D71920] mt-1">
                  {subscribers.filter(s => s.type === 'phone').length}
                </div>
                <span className="text-[11px] text-neutral-500 font-medium mt-1 block">Ready for SMS Campaign</span>
              </div>

              <div className="bg-[#F7F7F8] p-4 rounded-2xl border border-neutral-200">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Email Subscribers</span>
                <div className="text-2xl font-black text-blue-600 mt-1">
                  {subscribers.filter(s => s.type === 'email').length}
                </div>
                <span className="text-[11px] text-neutral-500 font-medium mt-1 block">Ready for Email Newsletter</span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F7F7F8] p-3 rounded-2xl border border-neutral-200">
              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search by phone number or email..."
                  value={subSearchQuery}
                  onChange={e => setSubSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <span className="text-xs font-bold text-neutral-500">
                Showing {subscribers.filter(s => {
                  if (!subSearchQuery.trim()) return true;
                  return s.emailOrPhone.toLowerCase().includes(subSearchQuery.toLowerCase());
                }).length} of {subscribers.length} total
              </span>
            </div>

            {/* Subscribers List */}
            <div className="space-y-2">
              {subscribers
                .filter(s => {
                  if (!subSearchQuery.trim()) return true;
                  return s.emailOrPhone.toLowerCase().includes(subSearchQuery.toLowerCase());
                })
                .sort((a, b) => b.subscribedAt - a.subscribedAt)
                .map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-300 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        sub.type === 'phone' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}>
                        {sub.type === 'phone' ? '📱' : <Mail size={16} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-neutral-900 truncate">
                            {sub.emailOrPhone}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            sub.type === 'phone' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sub.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Subscribed: {new Date(sub.subscribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(sub.subscribedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(sub.emailOrPhone);
                          alert(`Copied ${sub.emailOrPhone} to clipboard!`);
                        }}
                        className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 cursor-pointer"
                        title="Copy"
                      >
                        <Copy size={13} />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Remove subscriber ${sub.emailOrPhone}?`)) {
                            await deleteSubscriber(sub.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

              {subscribers.length === 0 && (
                <div className="text-center py-12 bg-[#F7F7F8] rounded-2xl border border-dashed border-neutral-300">
                  <Mail size={32} className="mx-auto text-neutral-400 mb-2" />
                  <p className="font-bold text-neutral-700 text-sm">No subscribers recorded yet.</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    When visitors enter their phone number or email in the footer, they will appear here automatically in real-time.
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

              {/* Bottom Sub-Tab Selector Grid (1. Header & Logo, 2. Footer & Links, 3. Payment & Shipping, 4. Social Media, 5. SEO & Support) */}
              <div className="p-2 sm:p-2.5 bg-white grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
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
                        <span className="font-black text-neutral-900 block">1. Footer Color Theme & Live Preview</span>
                        <span className="text-[11px] text-neutral-500">
                          Change the Footer background color and card color anytime from the Admin Panel
                        </span>
                      </div>

                      {/* Quick Preset Color Themes */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-neutral-500 mr-1">Presets:</span>
                        {[
                          { label: 'Classic Dark', bg: '#121212', card: '#1c1c1e' },
                          { label: 'Deep Black', bg: '#09090b', card: '#141417' },
                          { label: 'Midnight Navy', bg: '#0f172a', card: '#1e293b' },
                          { label: 'Crimson Dark', bg: '#1a090b', card: '#291014' },
                          { label: 'Forest Dark', bg: '#091912', card: '#11281e' }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, footerBgColor: preset.bg, footerCardBgColor: preset.card }))}
                            className="px-2 py-1 rounded-lg border border-neutral-300 bg-white hover:border-[#D71920] text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: preset.bg }} />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Main Footer Background Color Picker */}
                      <div className="md:col-span-3">
                        <label className="block font-bold text-[#5F6368] uppercase text-[11px] mb-1">Footer Background Color</label>
                        <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5">
                          <input
                            type="color"
                            value={settingsForm.footerBgColor || '#121212'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerBgColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.footerBgColor || '#121212'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerBgColor: e.target.value }))}
                            className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Footer Box/Card Color Picker */}
                      <div className="md:col-span-3">
                        <label className="block font-bold text-[#5F6368] uppercase text-[11px] mb-1">Footer Box / Card Color</label>
                        <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-xl px-2.5 py-1.5">
                          <input
                            type="color"
                            value={settingsForm.footerCardBgColor || '#1c1c1e'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerCardBgColor: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={settingsForm.footerCardBgColor || '#1c1c1e'}
                            onChange={e => setSettingsForm(prev => ({ ...prev, footerCardBgColor: e.target.value }))}
                            className="w-full text-xs font-mono font-bold text-neutral-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Live Mini Footer Preview Card */}
                      <div className="md:col-span-6">
                        <div
                          className="p-2.5 rounded-xl border border-neutral-300 flex items-center justify-between gap-3"
                          style={{ backgroundColor: settingsForm.footerBgColor || '#121212' }}
                        >
                          <div
                            className="px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2 flex-1"
                            style={{ backgroundColor: settingsForm.footerCardBgColor || '#1c1c1e' }}
                          >
                            {(() => {
                              const hasLogo = isValidImageUrl(settingsForm.footerLogoUrl);
                              const rawName = (settingsForm.footerBrandName ?? '').trim();
                              const hasName = rawName.length > 0;
                              const showIcon = !hasLogo && hasName && settingsForm.showFooterIcon !== false;
                              const c1 = settingsForm.footerNameColor1 || '#FFFFFF';
                              const c2 = settingsForm.footerNameColor2 || '#D71920';

                              if (!hasLogo && !hasName) {
                                return <span className="text-[11px] italic text-zinc-400">Empty Footer Brand</span>;
                              }

                              return (
                                <>
                                  {hasLogo && (
                                    <img
                                      src={settingsForm.footerLogoUrl}
                                      alt=""
                                      onError={() => setSettingsForm(prev => ({ ...prev, footerLogoUrl: '' }))}
                                      className="h-7 w-auto max-w-[100px] object-contain rounded bg-white p-0.5"
                                    />
                                  )}
                                  {showIcon && (
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: c2 }}>
                                      <BookOpen size={14} />
                                    </div>
                                  )}
                                  {hasName && (
                                    <span className="font-black text-sm tracking-tight">
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
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 pr-1 shrink-0">Live Footer Preview</span>
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
                    <span className="font-black text-neutral-900 uppercase block">Marketing & Conversion Tracking (Pixel / CAPI / GA4)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Facebook Pixel ID</label>
                        <input
                          type="text"
                          value={settingsForm.facebookPixelId || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#5F6368] mb-1">Facebook CAPI Access Token</label>
                        <input
                          type="password"
                          value={settingsForm.facebookCapiToken || ''}
                          onChange={e => setSettingsForm(prev => ({ ...prev, facebookCapiToken: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white"
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
        </main>

        {/* Dedicated Standalone Admin Portal Footer */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            MR. BOOKS Administrative Management Console • Connected to Firebase (<code className="text-slate-700 font-mono">mr-book-new</code>)
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time Firestore Engine Active
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
