import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
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
  Check,
  Edit2
} from 'lucide-react';
import { Author, Banner } from '../types';

export function AdminDashboard() {
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
    deleteCategory
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'payment-methods' | 'orders' | 'products' | 'categories' | 'banners' | 'authors' | 'settings'>('overview');

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

  // New Product modal state
  const [showAddProdModal, setShowAddProdModal] = useState(false);
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

  // Reject reason modal
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Stats
  const totalRevenue = orders.filter(o => o.paymentStatus === 'approved').reduce((sum, o) => sum + o.total, 0);
  const pendingVerificationsCount = paymentSubmissions.filter(s => s.status === 'pending_verification').length;

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

    await addProduct({
      type: prodType,
      title: prodTitle,
      slug: prodTitle.toLowerCase().replace(/ /g, '-'),
      description: 'Newly added book or stationery item.',
      category: prodCategory,
      author: prodAuthor,
      publisher: 'MR. BOOKS Publications',
      images: allImages,
      price: prodPrice,
      previousPrice: prodPrice + 100,
      stock: 100,
      sku: 'MRB-' + Math.floor(1000 + Math.random() * 9000),
      rating: 5.0,
      reviewCount: 1,
      isOriginalBadge: prodIsOriginal,
      deliveryEstimate: prodDeliveryEstimate,
      variants: parsedVariants.length > 0 ? parsedVariants : [
        { id: 'v1', name: 'Paperback', price: prodPrice, stock: 100, sku: 'MRB-PB' }
      ]
    });
    setProdTitle('');
    setProdAuthor('');
    setProdImage('');
    setProdExtraImages('');
    setProdPrintVariants('Paperback, Hardcover');
    setProdIsOriginal(true);
    setProdDeliveryEstimate('2-3 Days');
    setShowAddProdModal(false);
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBannerImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuthorFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAuthorPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage) return;

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
    }

    setShowAddBannerModal(false);
    setEditingBannerId(null);
  };

  const handleSaveAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName) return;

    if (editingAuthorId) {
      await updateAuthor(editingAuthorId, {
        name: authorName,
        bio: authorBio,
        photoUrl: authorPhoto,
        booksCount: authorBooksCount
      });
    } else {
      await addAuthor({
        id: 'author-' + Date.now(),
        name: authorName,
        bio: authorBio,
        photoUrl: authorPhoto,
        booksCount: authorBooksCount
      });
    }

    setShowAddAuthorModal(false);
    setEditingAuthorId(null);
    setAuthorName('');
    setAuthorBio('');
    setAuthorPhoto('');
    setAuthorBooksCount(20);
  };

  const handleCategoryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCatImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingCatId) {
      await updateCategory(editingCatId, {
        name: catName,
        type: catType,
        slug,
        image: catImage,
        showOnHome: catShowOnHome
      });
    } else {
      await addCategory({
        id: 'cat-' + Date.now(),
        name: catName,
        type: catType,
        slug,
        image: catImage,
        showOnHome: catShowOnHome
      });
    }

    setShowAddCatModal(false);
    setEditingCatId(null);
    setCatName('');
    setCatImage('');
    setCatShowOnHome(true);
  };

  return (
    <div className="min-h-screen bg-white transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header Banner - Bright, Crisp Light Theme */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 text-[#171717] shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#E5E5E5]">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 bg-[#D71920] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#D71920]/25">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#FFF1F2] text-[#D71920] text-[11px] font-bold px-3 py-1 rounded-full mb-1 border border-[#D71920]/25">
                Authorized Admin Control Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#171717]">
                MR. BOOKS Admin Portal
              </h1>
              <p className="text-xs text-[#5F6368]">
                Administrator: <strong>mr.booksbd700@gmail.com</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial bg-[#F7F7F8] px-4 py-3 rounded-2xl border border-[#E5E5E5] text-center">
              <span className="block text-[10px] text-[#5F6368] uppercase font-bold tracking-wider">Pending Verification</span>
              <span className="text-xl font-black text-amber-700">{pendingVerificationsCount}</span>
            </div>
            <div className="flex-1 md:flex-initial bg-[#F7F7F8] px-4 py-3 rounded-2xl border border-[#E5E5E5] text-center">
              <span className="block text-[10px] text-[#5F6368] uppercase font-bold tracking-wider">Verified Revenue</span>
              <span className="text-xl font-black text-emerald-700">৳{totalRevenue}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'categories', label: `Categories (${categories.length})`, icon: BookOpen },
            { id: 'banners', label: `Hero Banners (${banners.length})`, icon: ImageIcon },
            { id: 'authors', label: `Writers & Authors (${authors.length})`, icon: Users },
            { id: 'verifications', label: `Payment Verifications (${pendingVerificationsCount})`, icon: CreditCard },
            { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
            { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
            { id: 'products', label: `Catalog (${products.length})`, icon: BookOpen },
            { id: 'settings', label: 'Store Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#D71920] text-white shadow-md shadow-[#D71920]/25' 
                    : 'bg-white border border-[#E5E5E5] text-[#171717] hover:border-[#D71920]'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between text-[#777777]">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                  <Package size={18} className="text-[#D71920]" />
                </div>
                <h3 className="text-3xl font-black text-[#171717] mt-2">{orders.length}</h3>
                <p className="text-xs text-[#5F6368] mt-1">Across all districts</p>
              </div>

              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between text-[#777777]">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
                  <Clock size={18} className="text-amber-500" />
                </div>
                <h3 className="text-3xl font-black text-amber-700 mt-2">{pendingVerificationsCount}</h3>
                <p className="text-xs text-[#5F6368] mt-1">Requires statement matching</p>
              </div>

              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between text-[#777777]">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
                  <BookOpen size={18} className="text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-[#171717] mt-2">{products.length}</h3>
                <p className="text-xs text-[#5F6368] mt-1">Books and stationery items</p>
              </div>

              <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between text-[#777777]">
                  <span className="text-xs font-bold uppercase tracking-wider">Verified Revenue</span>
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <h3 className="text-3xl font-black text-emerald-700 mt-2">৳{totalRevenue}</h3>
                <p className="text-xs text-[#5F6368] mt-1">Approved payments</p>
              </div>
            </div>

            {/* Recent Orders quick preview */}
            <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 shadow-xs">
              <h3 className="text-base font-black text-[#171717] mb-4">
                Latest Customer Orders
              </h3>
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="p-4 rounded-xl bg-[#F7F7F8] border border-[#E5E5E5] flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#D71920]">#{o.id}</span>
                        <div className="font-bold text-sm text-[#171717]">{o.customerName} ({o.phone})</div>
                        <div className="text-xs text-[#5F6368]">{o.items.length} items • {o.district}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-[#171717]">৳{o.total}</div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#171717] border border-[#E5E5E5]">
                          {o.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#777777]">No orders registered yet.</p>
              )}
            </div>
          </div>
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
            <h2 className="text-xl font-black text-[#171717]">All Store Orders & Dispatch</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#F7F7F8] text-[#5F6368] uppercase font-bold tracking-wider">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">District</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Fulfillment</th>
                    <th className="py-3 px-3 text-right">Update Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEE]">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-[#F7F7F8] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#D71920]">{o.id}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#171717]">{o.customerName}</div>
                        <div className="text-[11px] text-[#5F6368]">{o.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-medium">{o.district}</td>
                      <td className="py-3 px-3 font-black text-[#171717]">৳{o.total}</td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold tracking-wider">{o.paymentStatus}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F7F8] border border-[#E5E5E5] capitalize text-[#171717]">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select 
                          value={o.orderStatus}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                          className="px-2.5 py-1 rounded-lg border border-[#E5E5E5] bg-white text-xs font-bold text-[#171717]"
                        >
                          <option value="awaiting_payment">Awaiting Payment</option>
                          <option value="awaiting_payment_verification">Awaiting Verification</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: CATALOG & INVENTORY */}
        {activeTab === 'products' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEEEEE]">
              <h2 className="text-xl font-black text-[#171717]">Books & Stationery Inventory</h2>
              <button 
                onClick={() => setShowAddProdModal(true)}
                className="px-4 py-2 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] flex items-center gap-3.5">
                  <img src={p.images[0]} alt="" className="w-14 h-18 object-contain bg-white rounded-lg p-1 border border-[#E5E5E5]" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#D71920]">{p.type}</span>
                    <h4 className="font-bold text-xs text-[#171717] truncate">{p.title}</h4>
                    <p className="text-xs font-black text-[#171717] mt-1">৳{p.price}</p>
                    <button 
                      onClick={() => deleteProduct(p.id)}
                      className="mt-1 text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAddProdModal && (
              <form onSubmit={handleCreateProduct} className="p-5 bg-[#F7F7F8] rounded-2xl border border-[#E5E5E5] space-y-3">
                <h3 className="font-bold text-sm text-[#171717]">Add New Book or Stationery</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input type="text" placeholder="Title" required value={prodTitle} onChange={e => setProdTitle(e.target.value)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  <select value={prodType} onChange={e => setProdType(e.target.value as any)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]">
                    <option value="book">Book</option>
                    <option value="stationery">Stationery</option>
                  </select>
                  <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]">
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Price (BDT)" required value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                  <input type="text" placeholder="Author / Brand" required value={prodAuthor} onChange={e => setProdAuthor(e.target.value)} className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717] sm:col-span-2" />
                </div>
                
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    Main Photo URL:
                  </label>
                  <input type="url" placeholder="Cover Image URL (e.g. https://...)" value={prodImage} onChange={e => setProdImage(e.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]" />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    Book Print Editions / Formats (Auto-rotates every 3-4s on Home):
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Paperback, Hardcover, Regular Print, Premium Print" 
                    value={prodPrintVariants} 
                    onChange={e => setProdPrintVariants(e.target.value)} 
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                  />
                  <span className="text-[10px] text-[#777777] block">
                    Tip: Enter comma-separated print editions (Paperback, Hardcover, Premium Print, etc.) to cycle automatically on product cards!
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
                    Delivery Estimate:
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 2-3 Days, 5-7 Days" 
                    value={prodDeliveryEstimate} 
                    onChange={e => setProdDeliveryEstimate(e.target.value)} 
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E5] bg-white text-xs text-[#171717]"
                  />
                </div>

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

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddProdModal(false)} className="px-4 py-1.5 bg-white text-xs font-bold rounded-lg border border-[#E5E5E5] cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-[#D71920] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer">Save to Catalog</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="bg-white border border-[#E5E5E5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EEEEEE]">
              <div>
                <h2 className="text-xl font-black text-[#171717] flex items-center gap-2">
                  <BookOpen size={20} className="text-[#D71920]" /> Store Book & Stationery Categories
                </h2>
                <p className="text-xs text-[#5F6368] mt-1">
                  Add or edit categories with picture images. Photos will be displayed prominently on the home page and category filters.
                </p>
              </div>
              <button 
                onClick={() => {
                  setEditingCatId(null);
                  setCatName('');
                  setCatType('book');
                  setCatImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80');
                  setCatShowOnHome(true);
                  setShowAddCatModal(true);
                }}
                className="px-4 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
              >
                <Plus size={14} /> Add Category
              </button>
            </div>

            {/* Category List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 rounded-2xl border border-[#E5E5E5] bg-[#F7F7F8] flex items-center gap-3.5 shadow-2xs group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E5E5E5] bg-white">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-[#FFF1F2] text-[#D71920] font-black flex items-center justify-center text-sm">
                        {cat.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold uppercase text-[#D71920]">{cat.type} Category</span>
                      
                      {/* Quick Toggle Button for Homepage Display */}
                      <button 
                        onClick={() => updateCategory(cat.id, { showOnHome: !(cat.showOnHome !== false) })}
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                          cat.showOnHome !== false 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                        }`}
                        title="Click to toggle display on homepage"
                      >
                        {cat.showOnHome !== false ? '✓ Home ON' : '✕ Home OFF'}
                      </button>
                    </div>

                    <h4 className="font-bold text-sm text-[#171717] truncate">{cat.name}</h4>
                    <p className="text-[11px] text-[#5F6368] font-mono mt-0.5">/{cat.slug}</p>

                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setCatName(cat.name);
                          setCatType(cat.type);
                          setCatImage(cat.image || '');
                          setCatShowOnHome(cat.showOnHome !== false);
                          setShowAddCatModal(true);
                        }}
                        className="text-[11px] text-[#171717] hover:text-[#D71920] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 size={11} /> Edit
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                          onClick={() => updateBanner(b.id, { isActive: b.isActive === false })}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${
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
                          onClick={() => deleteBanner(b.id)}
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
                        className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} /> Save Banner
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
            <h2 className="text-xl font-black text-[#171717]">Store Branding & Delivery Charges</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold uppercase text-[#5F6368] mb-1">Store Name</label>
                <input type="text" defaultValue={settings.storeName} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[#5F6368] mb-1">Hotline Phone</label>
                <input type="text" defaultValue={settings.phone} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[#5F6368] mb-1">Inside Dhaka Delivery Fee (৳)</label>
                <input type="number" defaultValue={settings.insideDhakaCharge} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" />
              </div>
              <div>
                <label className="block font-bold uppercase text-[#5F6368] mb-1">Outside Dhaka Delivery Fee (৳)</label>
                <input type="number" defaultValue={settings.outsideDhakaCharge} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F8] text-[#171717]" />
              </div>
            </div>
            <button className="px-6 py-2.5 bg-[#D71920] hover:bg-[#B9151B] text-white font-bold rounded-xl text-xs shadow-md cursor-pointer">
              Save Store Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
