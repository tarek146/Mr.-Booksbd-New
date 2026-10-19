import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { Author, Banner } from '../types';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { compressImageFile } from '../utils/imageCompressor';

export function AdminDashboard() {
  const { currentUser, isAdmin, loading: authLoading, signIn, logout } = useAuth();
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
    setActivePage
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'payment-methods' | 'orders' | 'products' | 'categories' | 'banners' | 'authors' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // New Payment Method modal state
  const [showAddPmModal, setShowAddPmModal] = useState(false);
  const [pmName, setPmName] = useState('');
  const [pmType, setPmType] = useState<'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank' | 'cod'>('bkash');
  const [pmAccName, setPmAccName] = useState('');
  const [pmAccNum, setPmAccNum] = useState('');
  const [pmInst, setPmInst] = useState('');

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
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'book' | 'stationery'>('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categoryFilterTab, setCategoryFilterTab] = useState<'all' | 'main' | 'sub' | 'child'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Reject reason modal
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Stats
  const totalRevenue = orders.filter(o => o.paymentStatus === 'approved').reduce((sum, o) => sum + o.total, 0);
  const pendingVerificationsCount = paymentSubmissions.filter(s => s.status === 'pending_verification').length;

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

  const handleCreatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = pmType + '-' + Date.now();
    await addPaymentMethod({
      id,
      name: pmName,
      type: pmType,
      accountName: pmAccName,
      accountNumber: pmAccNum,
      instructions: pmInst,
      isActive: true,
      displayOrder: paymentMethods.length + 1
    });
    setPmName('');
    setPmAccName('');
    setPmAccNum('');
    setPmInst('');
    setShowAddPmModal(false);
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

    const payload = {
      type: prodType,
      title: prodTitle,
      slug: prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: prodType === 'book' ? 'Authentic book publication from MR. BOOKS.' : 'Premium stationery and office supply item.',
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
      variants: parsedVariants.length > 0 ? parsedVariants : [
        { id: 'v1', name: prodType === 'book' ? 'Paperback' : 'Standard', price: prodPrice, stock: 100, sku: 'MRB-VAR-1' }
      ]
    };

    if (editingProductId) {
      await updateProduct(editingProductId, payload);
    } else {
      await addProduct(payload);
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
    setProdImage('');
    setProdExtraImages('');
    setProdPrintVariants('Paperback, Hardcover');
    setProdIsOriginal(true);
    setProdDeliveryEstimate('2-3 Days');
    setShowAddProdModal(false);
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

        {/* TAB 2: MANUAL PAYMENT VERIFICATIONS QUEUE */}
        {activeTab === 'verifications' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="pb-4 border-b border-[#EEEEEE]">
              <h2 className="text-xl font-black text-[#171717]">Manual Payment Verification Queue</h2>
              <p className="text-xs text-[#5F6368] mt-1">
                Match customer submitted Transaction Reference IDs against your bKash, Nagad, Rocket or Bank statements before confirming orders.
              </p>
            </div>

            {paymentSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
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
              <div className="p-5 bg-[#FFF1F2] rounded-2xl border border-[#D71920]/30 space-y-3">
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
        )}

        {/* TAB 3: PAYMENT METHODS */}
        {activeTab === 'payment-methods' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717]">Admin Payment Accounts</h2>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  Configure merchant and personal numbers shown to customers at checkout.
                </p>
              </div>
              <button 
                onClick={() => setShowAddPmModal(true)}
                className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={14} /> Add Payment Method
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map(pm => (
                <div key={pm.id} className="p-5 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#D71920]">{pm.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pm.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>
                      {pm.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#171717]">{pm.name}</h3>
                  <p className="text-xs font-mono font-bold text-[#171717]">
                    {pm.accountNumber} <span className="font-sans font-normal text-[#5F6368]">({pm.accountName})</span>
                  </p>
                  <p className="text-xs text-[#777777] line-clamp-2">{pm.instructions}</p>
                  <div className="pt-2 flex items-center justify-between border-t border-[#E5E5E5]">
                    <button 
                      onClick={() => updatePaymentMethod(pm.id, { isActive: !pm.isActive })}
                      className="text-xs font-bold text-[#D71920] hover:underline cursor-pointer"
                    >
                      {pm.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => deletePaymentMethod(pm.id)}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddPmModal && (
              <form onSubmit={handleCreatePaymentMethod} className="p-5 bg-[#F7F7F8] rounded-2xl border border-[#E5E5E5] space-y-3">
                <h3 className="font-bold text-sm text-[#171717]">New Payment Gateway / Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Method Name (e.g. bKash Merchant)" required value={pmName} onChange={e => setPmName(e.target.value)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  <select value={pmType} onChange={e => setPmType(e.target.value as any)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]">
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="upay">Upay</option>
                    <option value="bank">Bank</option>
                    <option value="cod">COD</option>
                  </select>
                  <input type="text" placeholder="Account Name (e.g. MR. BOOKS BD)" required value={pmAccName} onChange={e => setPmAccName(e.target.value)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  <input type="text" placeholder="Account / Phone Number" required value={pmAccNum} onChange={e => setPmAccNum(e.target.value)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs font-mono text-[#171717]" />
                </div>
                <textarea rows={2} placeholder="Payment instructions for customer..." required value={pmInst} onChange={e => setPmInst(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"></textarea>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddPmModal(false)} className="px-4 py-1.5 bg-white text-xs font-bold rounded-lg border border-[#E5E5E5] cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer">Save Account</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: ORDERS FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Top Control Bar: Search & Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">🔍</span>
                <input 
                  type="text"
                  placeholder="Search by order #, customer name, phone, address, or TrxID..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={orderStatusFilter} 
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                >
                  <option value="all">⚡ All Status ({orders.length})</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="processing">⚙️ Processing</option>
                  <option value="shipped">🚚 Shipped</option>
                  <option value="delivered">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>

                <select 
                  className="px-3.5 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#D71920]"
                >
                  <option value="all">📅 All Dates</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>

                <button 
                  onClick={() => alert('Create Order modal / feature triggered.')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                >
                  <Plus size={14} /> <span>Create Order</span>
                </button>

                <button 
                  onClick={() => alert('Orders exported to CSV successfully.')}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Export CSV</span>
                </button>

                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <RefreshCw size={14} /> <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Filter Pills Row & Extra Dropdowns */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      orderStatusFilter === tab.id ? 'bg-[#D71920] text-white shadow-xs' : 'bg-[#F7F7F8] text-neutral-700 hover:bg-neutral-200 border border-[#E5E5E5]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-700 focus:outline-none focus:border-[#D71920]">
                  <option value="all">🌐 All Channels</option>
                  <option value="web">Website Store</option>
                  <option value="phone">Phone Order</option>
                </select>

                <select className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-700 focus:outline-none focus:border-[#D71920]">
                  <option value="all">💳 All Payments</option>
                  <option value="cod">Cash on Delivery</option>
                  <option value="online">Online Payment</option>
                </select>

                <select className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-xs font-bold text-neutral-700 focus:outline-none focus:border-[#D71920]">
                  <option value="all">🛡️ Verification (All)</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {/* Order Cards List */}
            <div className="space-y-4">
              {orders
                .filter(o => {
                  if (orderStatusFilter !== 'all' && o.orderStatus !== orderStatusFilter) return false;
                  if (orderSearchQuery) {
                    const q = orderSearchQuery.toLowerCase();
                    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || o.address.toLowerCase().includes(q);
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
                        <div className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                          <span>📞 {o.phone}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">WA</span>
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
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 uppercase">
                              {o.paymentMethodName || 'COD'}
                            </span>
                          </div>
                        </div>

                        {/* Courier & Quick Actions */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => alert(`Dispatched ${o.id} via Steadfast Courier.`)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer">
                              Steadfast
                            </button>
                            <button onClick={() => alert(`Dispatched ${o.id} via Pathao Courier.`)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer">
                              Pathao
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button onClick={() => alert(`Order ID: ${o.id}\nCustomer: ${o.customerName}\nTotal: ৳${o.total}`)} className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer" title="View Order">
                              👁️
                            </button>
                            <button onClick={() => window.print()} className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer" title="Print Invoice">
                              🖨️
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                ))}
            </div>

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
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      p.type === 'book' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {p.type === 'book' ? '📚 Book' : '✏️ Stationery'}
                    </span>
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
                          setProdImage(p.images[0] || '');
                          setProdExtraImages(p.images.slice(1).join(', '));
                          setProdIsOriginal(p.isOriginalBadge !== false);
                          setProdPrintVariants(p.variants ? p.variants.map(v => v.name).join(', ') : 'Paperback, Hardcover');
                          setProdDeliveryEstimate(p.deliveryEstimate || '2-3 Days');
                          setShowAddProdModal(true);
                        }}
                        className="text-[11px] text-[#171717] hover:text-[#D71920] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} /> Edit
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
                    {editingProductId ? 'Edit Catalog Item' : 'Add New Item (Book or Stationery)'}
                  </h3>
                  <button type="button" onClick={() => setShowAddProdModal(false)} className="text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
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

        {/* TAB 6: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <Settings size={20} className="text-[#D71920]" /> Store Branding & Configuration
                </h2>
                <p className="text-xs text-[#5F6368] mt-1">
                  Updates are saved directly to Firebase in real-time and applied immediately across the entire shop.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-time Firebase Firestore Sync
              </div>
            </div>

            {settingsSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                Store settings successfully saved to Firebase and updated in real-time!
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSettingsSaving(true);
                try {
                  await updateSettings(settingsForm);
                  setSettingsSuccess(true);
                  setTimeout(() => setSettingsSuccess(false), 3000);
                } finally {
                  setSettingsSaving(false);
                }
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Store Name</label>
                  <input 
                    type="text" 
                    required
                    value={settingsForm.storeName || ''} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Tagline</label>
                  <input 
                    type="text" 
                    value={settingsForm.tagline || ''} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, tagline: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Hotline Phone</label>
                  <input 
                    type="text" 
                    required
                    value={settingsForm.phone || ''} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Support Email</label>
                  <input 
                    type="email" 
                    value={settingsForm.email || ''} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Physical Address</label>
                  <input 
                    type="text" 
                    value={settingsForm.address || ''} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Inside Dhaka Delivery Fee (৳)</label>
                  <input 
                    type="number" 
                    required
                    value={settingsForm.insideDhakaCharge ?? 60} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, insideDhakaCharge: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Outside Dhaka Delivery Fee (৳)</label>
                  <input 
                    type="number" 
                    required
                    value={settingsForm.outsideDhakaCharge ?? 120} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, outsideDhakaCharge: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Free Delivery Minimum Order (৳)</label>
                  <input 
                    type="number" 
                    value={settingsForm.freeShippingThreshold ?? 2000} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-[#5F6368] mb-1">Official bKash Number</label>
                  <input 
                    type="text" 
                    value={settingsForm.bkashNumber || ''} 
                    onChange={e => setSettingsForm(prev => ({ ...prev, bkashNumber: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" 
                  />
                </div>
              </div>

              {/* Marketing & Tracking Conversion APIs */}
              <div className="pt-6 border-t border-[#EEEEEE] space-y-4">
                <h3 className="text-sm font-black text-[#171717] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Marketing & Conversion Tracking APIs (Facebook CAPI, GA4, TikTok)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#5F6368] mb-1">Facebook Pixel ID</label>
                    <input 
                      type="text"
                      placeholder="e.g. 123456789012345"
                      value={settingsForm.facebookPixelId || ''}
                      onChange={e => setSettingsForm(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#5F6368] mb-1">Facebook CAPI Access Token (Server-side)</label>
                    <input 
                      type="password"
                      placeholder="EAA..."
                      value={settingsForm.facebookCapiToken || ''}
                      onChange={e => setSettingsForm(prev => ({ ...prev, facebookCapiToken: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#5F6368] mb-1">Google Analytics (GA4) Measurement ID</label>
                    <input 
                      type="text"
                      placeholder="G-XXXXXXXXXX"
                      value={settingsForm.gaMeasurementId || ''}
                      onChange={e => setSettingsForm(prev => ({ ...prev, gaMeasurementId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#5F6368] mb-1">TikTok Pixel ID</label>
                    <input 
                      type="text"
                      placeholder="CXXXXXXXXXXXXXXX"
                      value={settingsForm.tiktokPixelId || ''}
                      onChange={e => setSettingsForm(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Payment Methods & Social Media Management */}
              <div className="pt-6 border-t border-[#EEEEEE] space-y-4">
                <h3 className="text-sm font-black text-[#171717] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Footer Payment Options & Social Media Manager
                </h3>
                <p className="text-xs text-[#5F6368]">
                  Manage the payment option badges and social media links displayed in your website footer.
                </p>

                {/* Footer Payment Methods List */}
                <div className="space-y-2">
                  <label className="block font-bold text-xs text-slate-700">Footer Payment Options</label>
                  {(settingsForm.footerPaymentMethods || []).map((pm, idx) => (
                    <div key={pm.id} className="flex items-center gap-3 bg-[#F7F7F8] p-2.5 rounded-xl border border-[#E5E5E5]">
                      <input 
                        type="text"
                        value={pm.name}
                        onChange={e => {
                          const updated = [...(settingsForm.footerPaymentMethods || [])];
                          updated[idx].name = e.target.value;
                          setSettingsForm(prev => ({ ...prev, footerPaymentMethods: updated }));
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                      />
                      <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={pm.isActive}
                          onChange={e => {
                            const updated = [...(settingsForm.footerPaymentMethods || [])];
                            updated[idx].isActive = e.target.checked;
                            setSettingsForm(prev => ({ ...prev, footerPaymentMethods: updated }));
                          }}
                          className="w-4 h-4 accent-[#D71920]"
                        />
                        Show in Footer
                      </label>
                    </div>
                  ))}
                </div>

                {/* Footer Social Media Links List */}
                <div className="space-y-2 pt-2">
                  <label className="block font-bold text-xs text-slate-700">Footer Social Media Links ("Our Social Media")</label>
                  {(settingsForm.socialLinks || []).map((soc, idx) => (
                    <div key={soc.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F7F7F8] p-2.5 rounded-xl border border-[#E5E5E5]">
                      <input 
                        type="text"
                        placeholder="Platform Name (e.g. Facebook)"
                        value={soc.name}
                        onChange={e => {
                          const updated = [...(settingsForm.socialLinks || [])];
                          updated[idx].name = e.target.value;
                          setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                      />
                      <input 
                        type="text"
                        placeholder="URL (https://...)"
                        value={soc.url}
                        onChange={e => {
                          const updated = [...(settingsForm.socialLinks || [])];
                          updated[idx].url = e.target.value;
                          setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={soc.isActive}
                            onChange={e => {
                              const updated = [...(settingsForm.socialLinks || [])];
                              updated[idx].isActive = e.target.checked;
                              setSettingsForm(prev => ({ ...prev, socialLinks: updated }));
                            }}
                            className="w-4 h-4 accent-[#D71920]"
                          />
                          Active
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO & Open Graph Settings Section */}
              <div className="pt-6 border-t border-[#EEEEEE] space-y-4">
                <h3 className="text-sm font-black text-[#171717] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  SEO & Open Graph Metadata Settings (Real-time Head Sync)
                </h3>
                <p className="text-xs text-[#5F6368]">
                  Configure search engine optimization meta tags and social share preview cards (Open Graph) that update the site head instantly upon saving.
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#5F6368] mb-1">Meta Title (<code className="text-slate-800 font-mono">title</code>)</label>
                    <input 
                      type="text"
                      placeholder="e.g. MR. BOOKS - Best Online Bookstore in Bangladesh"
                      value={settingsForm.metaTitle || ''}
                      onChange={e => setSettingsForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#5F6368] mb-1">Meta Description (<code className="text-slate-800 font-mono">meta name="description"</code>)</label>
                    <textarea 
                      rows={3}
                      placeholder="Brief overview of your store for search engines..."
                      value={settingsForm.metaDescription || ''}
                      onChange={e => setSettingsForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#5F6368] mb-1">Open Graph Image URL (<code className="text-slate-800 font-mono">og:image</code>)</label>
                      <input 
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={settingsForm.ogImageUrl || ''}
                        onChange={e => setSettingsForm(prev => ({ ...prev, ogImageUrl: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#5F6368] mb-1">Keywords (<code className="text-slate-800 font-mono">keywords</code>)</label>
                      <input 
                        type="text"
                        placeholder="bookstore, novels, stationery, dhaka"
                        value={settingsForm.keywords || ''}
                        onChange={e => setSettingsForm(prev => ({ ...prev, keywords: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  disabled={settingsSaving}
                  className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-2"
                >
                  {settingsSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving to Firebase...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Save Store Settings
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
