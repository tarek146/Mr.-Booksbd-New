import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  PaymentSubmission, 
  PaymentMethodConfig, 
  Category, 
  Author, 
  Banner,
  StoreSettings,
  Review,
  Subscriber
} from '../types';
import { 
  db, 
  seedInitialDataIfNeeded 
} from '../firebase';
import { 
  collection, 
  getDocs, 
  getDocsFromServer,
  doc, 
  getDoc,
  getDocFromServer,
  setDoc, 
  deleteDoc, 
  addDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { cleanForFirestore, addCacheBust } from '../utils/imageCompressor';
import { SyncTracker, REQUIRED_COLLECTIONS } from '../utils/syncManager';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  authors: Author[];
  banners: Banner[];
  paymentMethods: PaymentMethodConfig[];
  orders: Order[];
  paymentSubmissions: PaymentSubmission[];
  cart: CartItem[];
  wishlist: string[];
  settings: StoreSettings;
  activePage: string;
  selectedProductId: string | null;
  selectedCategoryFilter: string;
  searchQuery: string;
  darkMode: boolean;
  isLoading: boolean;
  
  setActivePage: (page: string, productId?: string) => void;
  setSelectedCategoryFilter: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setDarkMode: (dark: boolean) => void;
  
  addToCart: (product: Product, variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  
  toggleWishlist: (productId: string) => void;
  
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'paymentStatus' | 'orderStatus'>) => Promise<string>;
  submitPaymentProof: (sub: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addPaymentMethod: (method: PaymentMethodConfig) => Promise<void>;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethodConfig>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  
  addBanner: (banner: Banner) => Promise<void>;
  updateBanner: (id: string, data: Partial<Banner>) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;

  addAuthor: (author: Author) => Promise<void>;
  updateAuthor: (id: string, data: Partial<Author>) => Promise<void>;
  deleteAuthor: (id: string) => Promise<void>;

  addCategory: (cat: Category) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

   updateOrderStatus: (orderId: string, orderStatus: Order['orderStatus']) => Promise<void>;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus']) => Promise<void>;
  updateOrderTracking: (orderId: string, data: { orderStatus?: Order['orderStatus']; courierName?: string; trackingCode?: string; trackingUrl?: string; trackingNotes?: string }) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  reviewPaymentSubmission: (subId: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  reviews: Review[];
  addProductReview: (review: Omit<Review, 'id' | 'createdAt'>) => Promise<void>;

  subscribers: Subscriber[];
  addSubscriber: (emailOrPhone: string) => Promise<{ success: boolean; message: string; isNew: boolean }>;
  deleteSubscriber: (id: string) => Promise<void>;
  trackOrder: (orderIdOrPhone: string) => Promise<Order | null>;
}

function getPageFromLocation(): { page: string; productId: string | null } {
  if (typeof window === 'undefined') return { page: 'home', productId: null };

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '').replace(/\/+$/, '');
  const search = window.location.search.toLowerCase();

  // Admin routes: /admin, /admin/..., #admin, #/admin, ?page=admin
  if (
    pathname === '/admin' || 
    pathname.startsWith('/admin/') || 
    hash === 'admin' || 
    hash.startsWith('admin/') ||
    search.includes('page=admin')
  ) {
    return { page: 'admin', productId: null };
  }

  // Books / Shop routes
  if (pathname === '/books' || pathname === '/shop' || hash === 'books' || hash === 'shop') {
    return { page: 'books', productId: null };
  }

  // Stationery routes
  if (pathname === '/stationery' || hash === 'stationery') {
    return { page: 'stationery', productId: null };
  }

  // Cart route
  if (pathname === '/cart' || hash === 'cart') {
    return { page: 'cart', productId: null };
  }

  // Checkout route
  if (pathname === '/checkout' || hash === 'checkout') {
    return { page: 'checkout', productId: null };
  }

  // Order Success route
  if (pathname === '/order-success' || hash === 'order-success') {
    return { page: 'order-success', productId: null };
  }

  // My Orders / Tracking route
  if (pathname === '/my-orders' || pathname === '/orders' || hash === 'my-orders' || hash === 'orders') {
    return { page: 'my-orders', productId: null };
  }

  // Track Order route
  if (pathname === '/track' || pathname === '/track-order' || hash === 'track' || hash === 'track-order') {
    return { page: 'track-order', productId: null };
  }

  // Authors route
  if (pathname === '/authors' || hash === 'authors') {
    return { page: 'authors', productId: null };
  }

  // Product Detail route: /product/:id or /book/:id
  if (pathname.startsWith('/product/') || pathname.startsWith('/book/')) {
    const parts = window.location.pathname.split('/');
    const id = parts[2] ? decodeURIComponent(parts[2]) : null;
    return { page: 'product-detail', productId: id };
  }
  if (hash.startsWith('product/') || hash.startsWith('book/')) {
    const parts = hash.split('/');
    const id = parts[1] ? decodeURIComponent(parts[1]) : null;
    return { page: 'product-detail', productId: id };
  }

  return { page: 'home', productId: null };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isAdmin } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const addProductReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const id = 'rev-' + Date.now();
    const newRev: Review = {
      ...reviewData,
      id,
      createdAt: Date.now()
    };
    try {
      const cleaned = cleanForFirestore(newRev);
      await setDoc(doc(db, 'reviews', id), cleaned);
      setReviews(prev => [newRev, ...prev]);
    } catch (err: any) {
      console.error('Error adding review to Firebase:', err);
      setReviews(prev => [newRev, ...prev]);
    }
  };
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const initialRoute = getPageFromLocation();
  const [activePage, setActivePageState] = useState<string>(initialRoute.page);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productId);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [darkMode] = useState<boolean>(false);
  const setDarkMode = (_dark: boolean) => {};
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'MR. BOOKS',
    tagline: 'Your Trusted Bookstore & Stationery Partner in Bangladesh',
    phone: '+880 1712-345678',
    email: 'support@mrbooksbd.com',
    address: 'Nilkhet Book Market, Dhaka - 1205, Bangladesh',
    insideDhakaCharge: 60,
    outsideDhakaCharge: 120,
    freeShippingThreshold: 2000,
    logoUrl: '',
    footerLogoUrl: '',
    faviconUrl: '',
    facebookUrl: 'https://facebook.com/mrbooksbd',
    instagramUrl: 'https://instagram.com/mrbooksbd',
    youtubeUrl: 'https://youtube.com',
    bkashNumber: '01712345678',
    nagadNumber: '01812345678',
    facebookPixelId: '123456789012345',
    facebookCapiToken: '',
    gaMeasurementId: 'G-XXXXXXXXXX',
    tiktokPixelId: 'CXXXXXXXXXXXXXXX',
    footerPaymentMethods: [
      { id: 'p1', name: 'bKash Online', icon: 'bkash', isActive: true },
      { id: 'p2', name: 'Nagad Gateway', icon: 'nagad', isActive: true },
      { id: 'p3', name: 'Visa / MasterCard', icon: 'visa', isActive: true },
      { id: 'p4', name: 'Cash on Delivery', icon: 'cod', isActive: true }
    ],
    socialLinks: [
      { id: 's1', name: 'Facebook', url: 'https://facebook.com/mrbooksbd', icon: 'facebook', isActive: true },
      { id: 's2', name: 'Instagram', url: 'https://instagram.com/mrbooksbd', icon: 'instagram', isActive: true },
      { id: 's3', name: 'YouTube', url: 'https://youtube.com', icon: 'youtube', isActive: true },
      { id: 's4', name: 'TikTok', url: 'https://tiktok.com', icon: 'tiktok', isActive: true },
      { id: 's5', name: 'WhatsApp', url: 'https://wa.me/8801712345678', icon: 'message-circle', isActive: true }
    ],
    // Footer Subscription & Tracking Defaults
    showFooterSubscription: true,
    subscriptionTitle: 'Join MR. BOOKS Readers Club',
    subscriptionSubtitle: 'Subscribe to get 10% OFF discount coupon & new releases alert directly to your phone/email.',
    subscriptionDiscountBadge: 'Get 10% OFF Coupon',
    showFooterTracking: true,
    trackingTitle: 'Real-Time Order Tracking',
    trackingSubtitle: 'Enter your Order ID (ORD-...) or phone number to track your book package.',
    // Direct Contact Buttons (Product Detail & Support)
    whatsappNumber: '+880 1712-345678',
    callNumber: '+880 1712-345678',
    telegramUrl: 'https://t.me/mrbooksbd',
    messengerUrl: 'https://m.me/mrbooksbd',
    metaTitle: 'MR. BOOKS - Premium Online Bookstore & Stationery in Bangladesh',
    metaDescription: 'Buy bestselling books, novels, Islamic books, university textbooks, and premium stationery online in Bangladesh with fast nationwide delivery.',
    ogImageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80',
    keywords: 'bookstore bangladesh, online book shop dhaka, stationery, novel, islamic books, mr books',
    sundarbanDeliveryCharge: 120,
    enableSundarbanCourier: true,
    sundarbanForcesPrepayment: true,
    extraWeightChargePerKg: 20,
    deliveryNote: 'সুন্দরবন কুরিয়ার সার্ভিসের ক্ষেত্রে সম্পূর্ণ পেমেন্ট অগ্রিম প্রযোজ্য।'
  });

  // Real-time SEO and OpenGraph head synchronization
  useEffect(() => {
    if (settings.metaTitle) {
      document.title = settings.metaTitle;
    } else if (settings.storeName) {
      document.title = `${settings.storeName} - ${settings.tagline || 'Online Bookstore & Stationery'}`;
    }

    const updateMetaTag = (propertyOrName: string, content: string, isProperty = true) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${propertyOrName}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, propertyOrName);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (settings.metaDescription) {
      updateMetaTag('description', settings.metaDescription, false);
      updateMetaTag('og:description', settings.metaDescription, true);
    }
    if (settings.metaTitle) {
      updateMetaTag('og:title', settings.metaTitle, true);
    }
    if (settings.ogImageUrl) {
      updateMetaTag('og:image', settings.ogImageUrl, true);
    }
    if (settings.keywords) {
      updateMetaTag('keywords', settings.keywords, false);
    }
  }, [settings]);

  const setActivePage = (page: string, productId?: string) => {
    setActivePageState(page);
    if (productId) setSelectedProductId(productId);

    if (typeof window !== 'undefined') {
      let targetPath = '/';
      if (page === 'admin') targetPath = '/admin';
      else if (page === 'books' || page === 'shop') targetPath = '/books';
      else if (page === 'stationery') targetPath = '/stationery';
      else if (page === 'cart') targetPath = '/cart';
      else if (page === 'checkout') targetPath = '/checkout';
      else if (page === 'order-success') targetPath = '/order-success';
      else if (page === 'my-orders') targetPath = '/my-orders';
      else if (page === 'authors') targetPath = '/authors';
      else if (page === 'product-detail' && productId) targetPath = `/product/${encodeURIComponent(productId)}`;

      if (window.location.pathname !== targetPath) {
        try {
          window.history.pushState({ page, productId }, '', targetPath);
        } catch {
          window.location.hash = targetPath.replace(/^\//, '');
        }
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const loc = getPageFromLocation();
      setActivePageState(loc.page);
      if (loc.productId) setSelectedProductId(loc.productId);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);



  // 1. Authoritative Server-First Data Synchronization & Real-time Subscriptions
  useEffect(() => {
    let isMounted = true;
    const tracker = new SyncTracker();

    // Safety timeout: in case of extreme network stall or quota lock, unlock UI gracefully
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        tracker.setOffline(true);
        setIsLoading(false);
      }
    }, 7000);

    async function initializeStore() {
      try {
        // Fetch fresh authoritative data directly from Cloud Firestore servers
        const [prodSnap, catSnap, authSnap, bannerSnap, paySnap, setSnap, revSnap] = await Promise.all([
          getDocsFromServer(collection(db, 'products')),
          getDocsFromServer(collection(db, 'categories')),
          getDocsFromServer(collection(db, 'authors')),
          getDocsFromServer(collection(db, 'banners')),
          getDocsFromServer(collection(db, 'payment_methods')),
          getDocFromServer(doc(db, 'settings', 'general')),
          getDocsFromServer(collection(db, 'reviews'))
        ]);

        if (!isMounted) return;

        // Record server confirmation for all required collections
        REQUIRED_COLLECTIONS.forEach(col => tracker.recordSnapshot(col, false));

        setProducts(prodSnap.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
        setCategories(catSnap.docs.map(d => ({ ...d.data(), id: d.id } as Category)));
        setAuthors(authSnap.docs.map(d => ({ ...d.data(), id: d.id } as Author)));
        setBanners(bannerSnap.docs.map(d => ({ ...d.data(), id: d.id } as Banner)));
        setPaymentMethods(paySnap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethodConfig)));
        if (setSnap.exists()) {
          const st = setSnap.data() as StoreSettings;
          setSettings(prev => ({ ...prev, ...st }));
        }
        if (!revSnap.empty) {
          setReviews(revSnap.docs.map(d => ({ ...d.data(), id: d.id } as Review)));
        } else {
          setReviews([]);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.warn('Initial server fetch notice, falling back to cache if available:', err?.message);
        try {
          tracker.setOffline(true);
          const [prodSnap, catSnap, authSnap, bannerSnap, paySnap, setSnap, revSnap] = await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'authors')),
            getDocs(collection(db, 'banners')),
            getDocs(collection(db, 'payment_methods')),
            getDoc(doc(db, 'settings', 'general')),
            getDocs(collection(db, 'reviews'))
          ]);

          if (!isMounted) return;

          setProducts(prodSnap.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
          setCategories(catSnap.docs.map(d => ({ ...d.data(), id: d.id } as Category)));
          setAuthors(authSnap.docs.map(d => ({ ...d.data(), id: d.id } as Author)));
          setBanners(bannerSnap.docs.map(d => ({ ...d.data(), id: d.id } as Banner)));
          setPaymentMethods(paySnap.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethodConfig)));
          if (setSnap && setSnap.exists()) {
            setSettings(prev => ({ ...prev, ...(setSnap.data() as StoreSettings) }));
          }
          if (revSnap && !revSnap.empty) {
            setReviews(revSnap.docs.map(d => ({ ...d.data(), id: d.id } as Review)));
          }
        } catch (fallbackErr) {
          console.error('Fallback query error:', fallbackErr);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    }

    initializeStore();

    // 2. Real-time Listeners with Metadata Checks
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const fromCache = snapshot.metadata.fromCache;
        tracker.recordSnapshot('products', fromCache);

        if (!tracker.shouldApplySnapshot('products', fromCache)) {
          return; // Guard against stale IndexedDB cache flashing
        }

        setProducts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Product)));
        if (tracker.isInitialSyncComplete()) {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Products realtime listener notice:', err.message);
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const fromCache = snapshot.metadata.fromCache;
        tracker.recordSnapshot('categories', fromCache);

        if (!tracker.shouldApplySnapshot('categories', fromCache)) {
          return;
        }

        setCategories(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Category)));
        if (tracker.isInitialSyncComplete()) {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Categories realtime listener notice:', err.message);
      }
    );

    const unsubAuthors = onSnapshot(
      collection(db, 'authors'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const fromCache = snapshot.metadata.fromCache;
        tracker.recordSnapshot('authors', fromCache);

        if (!tracker.shouldApplySnapshot('authors', fromCache)) {
          return;
        }

        setAuthors(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Author)));
        if (tracker.isInitialSyncComplete()) {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Authors realtime listener notice:', err.message);
      }
    );

    const unsubBanners = onSnapshot(
      collection(db, 'banners'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const fromCache = snapshot.metadata.fromCache;
        tracker.recordSnapshot('banners', fromCache);

        if (!tracker.shouldApplySnapshot('banners', fromCache)) {
          return;
        }

        setBanners(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Banner)));
        if (tracker.isInitialSyncComplete()) {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Banners realtime listener notice:', err.message);
      }
    );

    const unsubPayments = onSnapshot(
      collection(db, 'payment_methods'),
      { includeMetadataChanges: true },
      (snapshot) => {
        const fromCache = snapshot.metadata.fromCache;
        tracker.recordSnapshot('payment_methods', fromCache);

        if (!tracker.shouldApplySnapshot('payment_methods', fromCache)) {
          return;
        }

        setPaymentMethods(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PaymentMethodConfig)));
        if (tracker.isInitialSyncComplete()) {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Payments realtime listener notice:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      { includeMetadataChanges: true },
      (snap) => {
        const fromCache = snap.metadata.fromCache;
        tracker.recordSnapshot('settings', fromCache);

        if (!tracker.shouldApplySnapshot('settings', fromCache)) {
          return;
        }

        if (snap.exists()) {
          const st = snap.data() as StoreSettings;
          setSettings(prev => ({ ...prev, ...st }));
        }
        if (tracker.isInitialSyncComplete()) {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn('Settings realtime listener notice:', err.message);
      }
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.empty) {
          setReviews(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Review)));
        } else {
          setReviews([]);
        }
      },
      (err) => {
        console.warn('Reviews realtime listener notice:', err.message);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubProducts();
      unsubCategories();
      unsubAuthors();
      unsubBanners();
      unsubPayments();
      unsubSettings();
      unsubReviews();
    };
  }, []);

  // 2. Auth-aware protected listeners: Orders & Payment Submissions
  // Prevents anonymous/customer permission-denied errors and protects customer privacy
  useEffect(() => {
    let unsubOrders: (() => void) | null = null;
    let unsubSubs: (() => void) | null = null;
    let unsubSubscribers: (() => void) | null = null;

    if (isAdmin) {
      // Administrator: Real-time sync for all orders, payment verification queues, and subscribers
      unsubOrders = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        },
        (err) => {
          console.warn('Admin orders listener notice:', err.message);
        }
      );

      unsubSubs = onSnapshot(
        collection(db, 'payment_submissions'),
        (snapshot) => {
          setPaymentSubmissions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PaymentSubmission)));
        },
        (err) => {
          console.warn('Admin submissions listener notice:', err.message);
        }
      );

      unsubSubscribers = onSnapshot(
        collection(db, 'subscribers'),
        (snapshot) => {
          setSubscribers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscriber)));
        },
        (err) => {
          console.warn('Admin subscribers listener notice:', err.message);
        }
      );
    } else if (currentUser) {
      // Authenticated Customer: Listen strictly to user's OWN orders
      const userOrdersQuery = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
      unsubOrders = onSnapshot(
        userOrdersQuery,
        (snapshot) => {
          setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        },
        (err) => {
          console.warn('User orders listener notice:', err.message);
        }
      );
      setPaymentSubmissions([]);
    } else {
      // Guest / Anonymous: Do not attach listeners to orders or submissions
      setOrders([]);
      setPaymentSubmissions([]);
    }

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubSubs) unsubSubs();
      if (unsubSubscribers) unsubSubscribers();
    };
  }, [currentUser, isAdmin]);


  const addToCart = (product: Product, variantId: string, quantity: number) => {
    const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
    const cartKey = `${product.id}-${variant.id}`;
    
    setCart(prev => {
      const existing = prev.find(item => `${item.productId}-${item.variantId}` === cartKey);
      if (existing) {
        return prev.map(item => 
          `${item.productId}-${item.variantId}` === cartKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          variantId: variant.id,
          title: product.title,
          variantName: variant.name,
          price: variant.price,
          image: product.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
          quantity,
          stock: variant.stock,
          type: product.type
        }];
      }
    });
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart(prev => prev.map(item => item.variantId === variantId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Admin action auditing helper
  const logAdminAction = async (action: string, target: string, details: string) => {
    if (!currentUser) return;
    try {
      const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      await setDoc(doc(db, 'audit_logs', logId), {
        id: logId,
        adminUid: currentUser.uid,
        adminEmail: currentUser.email || 'unknown',
        action,
        target,
        details,
        timestamp: Date.now()
      });
    } catch (err) {
      console.warn('Audit logging warning:', err);
    }
  };

  // Secure, Server/Catalog-Verified Order Creation with Atomic Stock Deduction
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'paymentStatus' | 'orderStatus'>): Promise<string> => {
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (!orderData.customerName || !orderData.phone || !orderData.address) {
      throw new Error('Please fill in required delivery information (Name, Phone, Address).');
    }

    // 1. Verify items & calculate TRUSTED subtotal from verified catalog prices
    const verifiedItems: CartItem[] = [];
    const stockUpdates: { productId: string; newStock: number; updatedVariants: any[] }[] = [];

    for (const item of orderData.items) {
      const liveProduct = products.find(p => p.id === item.productId);
      if (!liveProduct) {
        throw new Error(`Product not found or inactive: ${item.title}`);
      }

      const liveVariant = liveProduct.variants.find(v => v.id === item.variantId);
      // Trusted price retrieved from database catalog - ignoring any client-manipulated price
      const trustedPrice = liveVariant ? liveVariant.price : liveProduct.price;
      const currentStock = liveVariant ? liveVariant.stock : liveProduct.stock;
      const reqQty = Math.max(1, Math.floor(Number(item.quantity) || 1));

      // Inventory check: Prevent overselling
      if (currentStock < reqQty) {
        throw new Error(`Insufficient inventory for "${liveProduct.title} (${liveVariant?.name || 'Standard'})". Available: ${currentStock}, Requested: ${reqQty}`);
      }

      verifiedItems.push({
        ...item,
        price: trustedPrice,
        title: liveProduct.title,
        variantName: liveVariant?.name || item.variantName || 'Standard',
        quantity: reqQty,
        stock: currentStock,
        type: liveProduct.type
      });

      // Prepare safe stock deduction
      const newProductStock = Math.max(0, liveProduct.stock - reqQty);
      const updatedVariants = liveProduct.variants.map(v => {
        if (v.id === item.variantId) {
          return { ...v, stock: Math.max(0, v.stock - reqQty) };
        }
        return v;
      });

      stockUpdates.push({
        productId: liveProduct.id,
        newStock: newProductStock,
        updatedVariants
      });
    }

    // 2. Calculate verified subtotal
    const verifiedSubtotal = verifiedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 3. Calculate verified delivery fee from trusted configuration
    const isDhaka = orderData.district.trim().toLowerCase() === 'dhaka';
    const standardDeliveryFee = isDhaka 
      ? (settings.insideDhakaCharge ?? 60) 
      : (settings.outsideDhakaCharge ?? 120);
    const freeShippingThreshold = settings.freeShippingThreshold ?? 2000;
    const verifiedDeliveryFee = verifiedSubtotal >= freeShippingThreshold ? 0 : standardDeliveryFee;

    // 4. Calculate verified coupon discount (ignoring any arbitrary client discount)
    let verifiedDiscount = 0;
    if (orderData.discount > 0) {
      const calculatedDiscount = Math.round(verifiedSubtotal * 0.1);
      // Strict discount cap to prevent negative totals or excessive discounts
      verifiedDiscount = Math.min(300, Math.min(calculatedDiscount, verifiedSubtotal));
    }

    // 5. Calculate verified final total
    const verifiedTotal = Math.max(0, verifiedSubtotal - verifiedDiscount + verifiedDeliveryFee);

    // 6. Generate order ID and format secure record
    const orderId = 'MRB-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
    const resolvedUserId = currentUser?.uid || orderData.userId || ('guest-' + Date.now());

    const newOrder: Order = {
      id: orderId,
      userId: resolvedUserId,
      customerName: orderData.customerName.trim().slice(0, 100),
      phone: orderData.phone.trim().slice(0, 25),
      email: (orderData.email || currentUser?.email || '').trim().slice(0, 100),
      district: orderData.district.trim().slice(0, 50),
      city: (orderData.city || '').trim().slice(0, 50),
      address: orderData.address.trim().slice(0, 250),
      notes: (orderData.notes || '').trim().slice(0, 300),
      items: verifiedItems,
      subtotal: verifiedSubtotal,
      deliveryCharge: verifiedDeliveryFee,
      discount: verifiedDiscount,
      total: verifiedTotal,
      paymentMethodId: orderData.paymentMethodId,
      paymentMethodName: orderData.paymentMethodName,
      paymentStatus: 'unpaid',
      orderStatus: orderData.paymentMethodId === 'cod' ? 'confirmed' : 'awaiting_payment',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 7. Atomic transaction/batch write: Save order AND deduct inventory
    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', orderId), newOrder);

    for (const update of stockUpdates) {
      batch.set(doc(db, 'products', update.productId), {
        stock: update.newStock,
        variants: update.updatedVariants
      }, { merge: true });
    }

    await batch.commit();

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return orderId;
  };

  const submitPaymentProof = async (subData: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt'>) => {
    if (!subData.transactionReference || subData.transactionReference.trim().length < 3) {
      throw new Error('Please enter a valid Transaction ID.');
    }

    const subId = 'SUB-' + Math.floor(100000 + Math.random() * 900000);
    const newSub: PaymentSubmission = {
      ...subData,
      id: subId,
      transactionReference: subData.transactionReference.trim().slice(0, 50),
      senderIdentifier: (subData.senderIdentifier || '').trim().slice(0, 30),
      status: 'pending_verification',
      submittedAt: Date.now()
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'payment_submissions', subId), newSub);
    batch.set(doc(db, 'orders', subData.orderId), {
      paymentStatus: 'pending_verification',
      orderStatus: 'awaiting_payment_verification',
      paymentSubmissionId: subId,
      updatedAt: Date.now()
    }, { merge: true });

    await batch.commit();

    setPaymentSubmissions(prev => [newSub, ...prev]);
    setOrders(prev => prev.map(o => o.id === subData.orderId ? {
      ...o,
      paymentStatus: 'pending_verification',
      orderStatus: 'awaiting_payment_verification',
      paymentSubmissionId: subId,
      updatedAt: Date.now()
    } : o));
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const id = 'prod-' + Date.now();
    const newProd: Product = {
      ...productData,
      id,
      createdAt: Date.now()
    };
    try {
      const cleaned = cleanForFirestore(newProd);
      await setDoc(doc(db, 'products', id), cleaned);
      await logAdminAction('product_created', id, `Added product: ${newProd.title} (Price: ৳${newProd.price})`);
    } catch (err) {
      console.error('Firestore add product error:', err);
      throw err;
    }
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      const cleaned = cleanForFirestore(data);
      await setDoc(doc(db, 'products', id), cleaned, { merge: true });
      await logAdminAction('product_updated', id, `Updated product fields: ${Object.keys(data).join(', ')}`);
    } catch (err) {
      console.error('Firestore update product error:', err);
      throw err;
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await logAdminAction('product_deleted', id, `Deleted product id: ${id}`);
    } catch (err) {
      console.error('Firestore delete product error:', err);
      throw err;
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPaymentMethod = async (method: PaymentMethodConfig) => {
    try {
      const cleaned = cleanForFirestore(method);
      await setDoc(doc(db, 'payment_methods', method.id), cleaned);
      await logAdminAction('payment_method_created', method.id, `Added payment method: ${method.name}`);
    } catch (err) {
      console.error('Firestore add payment method error:', err);
      throw err;
    }
    setPaymentMethods(prev => [...prev.filter(m => m.id !== method.id), method]);
  };

  const updatePaymentMethod = async (id: string, data: Partial<PaymentMethodConfig>) => {
    try {
      const cleaned = cleanForFirestore(data);
      await setDoc(doc(db, 'payment_methods', id), cleaned, { merge: true });
      await logAdminAction('payment_method_updated', id, `Updated payment method: ${id}`);
    } catch (err) {
      console.error('Firestore update payment method error:', err);
      throw err;
    }
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payment_methods', id));
      await logAdminAction('payment_method_deleted', id, `Deleted payment method: ${id}`);
    } catch (err) {
      console.error('Firestore delete payment method error:', err);
      throw err;
    }
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const addBanner = async (banner: Banner) => {
    try {
      const cleaned = cleanForFirestore(banner);
      await setDoc(doc(db, 'banners', banner.id), cleaned);
      await logAdminAction('banner_created', banner.id, `Added banner: ${banner.title || 'Untitled'}`);
    } catch (err) {
      console.error('Firestore add banner error:', err);
      throw err;
    }
    setBanners(prev => [...prev.filter(b => b.id !== banner.id), banner]);
  };

  const updateBanner = async (id: string, data: Partial<Banner>) => {
    try {
      const cleaned = cleanForFirestore(data);
      await setDoc(doc(db, 'banners', id), cleaned, { merge: true });
      await logAdminAction('banner_updated', id, `Updated banner: ${id}`);
    } catch (err) {
      console.error('Firestore update banner error:', err);
      throw err;
    }
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      await logAdminAction('banner_deleted', id, `Deleted banner: ${id}`);
    } catch (err) {
      console.error('Firestore delete banner error:', err);
      throw err;
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const addAuthor = async (author: Author) => {
    try {
      const cleaned = cleanForFirestore(author);
      await setDoc(doc(db, 'authors', author.id), cleaned);
      await logAdminAction('author_created', author.id, `Added author: ${author.name}`);
    } catch (err) {
      console.error('Firestore add author error:', err);
      throw err;
    }
    setAuthors(prev => [...prev.filter(a => a.id !== author.id), author]);
  };

  const updateAuthor = async (id: string, data: Partial<Author>) => {
    try {
      const cleaned = cleanForFirestore(data);
      await setDoc(doc(db, 'authors', id), cleaned, { merge: true });
      await logAdminAction('author_updated', id, `Updated author: ${id}`);
    } catch (err) {
      console.error('Firestore update author error:', err);
      throw err;
    }
    setAuthors(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAuthor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'authors', id));
      await logAdminAction('author_deleted', id, `Deleted author: ${id}`);
    } catch (err) {
      console.error('Firestore delete author error:', err);
      throw err;
    }
    setAuthors(prev => prev.filter(a => a.id !== id));
  };

  const addCategory = async (cat: Category) => {
    try {
      const cleaned = cleanForFirestore(cat);
      await setDoc(doc(db, 'categories', cat.id), cleaned);
      await logAdminAction('category_created', cat.id, `Added category: ${cat.name}`);
    } catch (err) {
      console.error('Firestore add category error:', err);
      throw err;
    }
    setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat]);
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      const cleaned = cleanForFirestore(data);
      await setDoc(doc(db, 'categories', id), cleaned, { merge: true });
      await logAdminAction('category_updated', id, `Updated category: ${id}`);
    } catch (err) {
      console.error('Firestore update category error:', err);
      throw err;
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      await logAdminAction('category_deleted', id, `Deleted category: ${id}`);
    } catch (err) {
      console.error('Firestore delete category error:', err);
      throw err;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateOrderStatus = async (orderId: string, orderStatus: Order['orderStatus']) => {
    try {
      const cleaned = cleanForFirestore({ orderStatus, updatedAt: Date.now() });
      await setDoc(doc(db, 'orders', orderId), cleaned, { merge: true });
      await logAdminAction('order_status_updated', orderId, `Changed status to: ${orderStatus}`);
    } catch (err) {
      console.error('Firestore update order status error:', err);
      throw err;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus, updatedAt: Date.now() } : o));
  };

  const updateOrderPaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
    try {
      const cleaned = cleanForFirestore({ paymentStatus, updatedAt: Date.now() });
      await setDoc(doc(db, 'orders', orderId), cleaned, { merge: true });
      await logAdminAction('order_payment_status_updated', orderId, `Changed payment status to: ${paymentStatus}`);
    } catch (err) {
      console.error('Firestore update order payment status error:', err);
      throw err;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus, updatedAt: Date.now() } : o));
  };

  const updateOrderTracking = async (
    orderId: string, 
    data: { 
      orderStatus?: Order['orderStatus']; 
      courierName?: string; 
      trackingCode?: string; 
      trackingUrl?: string; 
      trackingNotes?: string;
    }
  ) => {
    try {
      const updatePayload = {
        ...data,
        updatedAt: Date.now()
      };
      await setDoc(doc(db, 'orders', orderId), cleanForFirestore(updatePayload), { merge: true });
      await logAdminAction('order_tracking_updated', orderId, `Updated tracking for Order #${orderId}: ${data.courierName || 'Courier'} (${data.trackingCode || 'No Code'})`);
    } catch (err) {
      console.error('Firestore update tracking error:', err);
      throw err;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...data, updatedAt: Date.now() } : o));
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      await logAdminAction('order_deleted', orderId, `Deleted order #${orderId}`);
    } catch (err) {
      console.error('Firestore delete order error:', err);
      throw err;
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const trackOrder = async (orderIdOrPhone: string): Promise<Order | null> => {
    const raw = orderIdOrPhone.trim().replace(/^#/, '');
    if (!raw) return null;

    // 1. Check local in-memory orders
    const rawCleanDigits = raw.replace(/[^0-9]/g, '');
    const foundLocal = orders.find(o => {
      const idMatch = o.id.toLowerCase() === raw.toLowerCase();
      const phoneDigits = o.phone.replace(/[^0-9]/g, '');
      const phoneMatch = rawCleanDigits.length >= 6 && phoneDigits.includes(rawCleanDigits);
      return idMatch || phoneMatch;
    });
    if (foundLocal) return foundLocal;

    // 2. Direct Firestore document fetch by ID
    try {
      const docRef = doc(db, 'orders', raw);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
    } catch (err) {
      console.warn('Direct order get notice:', err);
    }

    // 3. Fallback query by phone
    try {
      if (rawCleanDigits.length >= 6) {
        const q = query(collection(db, 'orders'), where('phone', '==', raw));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
        }
      }
    } catch (err) {
      console.warn('Phone order query notice:', err);
    }

    return null;
  };

  const addSubscriber = async (emailOrPhone: string): Promise<{ success: boolean; message: string; isNew: boolean }> => {
    const raw = emailOrPhone.trim();
    if (!raw) {
      return { success: false, message: 'Please enter a valid email or phone number.', isNew: false };
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const cleanPhone = raw.replace(/[^0-9+]/g, '');
    const isPhone = /^(\+?8801|01)[3-9]\d{8}$/.test(cleanPhone) || (cleanPhone.length >= 10 && cleanPhone.length <= 15);

    if (!isEmail && !isPhone) {
      return { success: false, message: 'Please enter a valid email (e.g. name@example.com) or 11-digit mobile number.', isNew: false };
    }

    const type = isEmail ? 'email' : 'phone';
    const normalized = isEmail ? raw.toLowerCase() : cleanPhone;

    const existing = subscribers.find(s => s.emailOrPhone.toLowerCase() === normalized.toLowerCase());
    if (existing) {
      return { success: true, message: 'You are already registered! Use coupon MRBOOKS10 for 10% off.', isNew: false };
    }

    const id = 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newSub: Subscriber = {
      id,
      emailOrPhone: normalized,
      type,
      subscribedAt: Date.now(),
      status: 'active',
      source: 'footer_subscription'
    };

    try {
      await setDoc(doc(db, 'subscribers', id), cleanForFirestore(newSub));
      setSubscribers(prev => [newSub, ...prev]);
      return { success: true, message: '🎉 Subscription successful! Welcome to MR. BOOKS Readers Club. Your 10% OFF code: MRBOOKS10', isNew: true };
    } catch (err: any) {
      console.warn('Subscribers Firestore write notice:', err);
      setSubscribers(prev => [newSub, ...prev]);
      return { success: true, message: '🎉 Subscription saved! Welcome to MR. BOOKS Readers Club. Your 10% OFF code: MRBOOKS10', isNew: true };
    }
  };

  const deleteSubscriber = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subscribers', id));
      await logAdminAction('subscriber_deleted', id, `Removed subscriber ${id}`);
    } catch (err) {
      console.error('Error deleting subscriber:', err);
    }
    setSubscribers(prev => prev.filter(s => s.id !== id));
  };

  const reviewPaymentSubmission = async (subId: string, status: 'approved' | 'rejected', reason?: string) => {
    const sub = paymentSubmissions.find(s => s.id === subId);
    if (!sub) return;

    const reviewedAt = Date.now();
    const subUpdate: Partial<PaymentSubmission> = {
      status,
      reviewedAt,
      rejectionReason: reason || ''
    };

    try {
      await setDoc(doc(db, 'payment_submissions', subId), cleanForFirestore(subUpdate), { merge: true });

      const newOrderStatus: Order['orderStatus'] = status === 'approved' ? 'confirmed' : 'awaiting_payment';
      const newPaymentStatus: Order['paymentStatus'] = status === 'approved' ? 'approved' : 'rejected';

      await setDoc(doc(db, 'orders', sub.orderId), cleanForFirestore({
        paymentStatus: newPaymentStatus,
        orderStatus: newOrderStatus,
        updatedAt: reviewedAt
      }), { merge: true });

      await logAdminAction(
        'payment_submission_reviewed', 
        subId, 
        `Payment ${status} for Order #${sub.orderId} (Amount: ৳${sub.claimedAmount}${reason ? `, Reason: ${reason}` : ''})`
      );
    } catch (err) {
      console.error('Firestore review payment error:', err);
      throw err;
    }

    const newOrderStatus: Order['orderStatus'] = status === 'approved' ? 'confirmed' : 'awaiting_payment';
    const newPaymentStatus: Order['paymentStatus'] = status === 'approved' ? 'approved' : 'rejected';

    setPaymentSubmissions(prev => prev.map(s => s.id === subId ? { ...s, ...subUpdate } : s));
    setOrders(prev => prev.map(o => o.id === sub.orderId ? {
      ...o,
      paymentStatus: newPaymentStatus,
      orderStatus: newOrderStatus,
      updatedAt: reviewedAt
    } : o));
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const cleaned = cleanForFirestore(newSettings);
      await setDoc(doc(db, 'settings', 'general'), cleaned, { merge: true });
      await logAdminAction('settings_updated', 'general', `Updated settings fields: ${Object.keys(newSettings).join(', ')}`);
    } catch (err) {
      console.error('Firestore update settings error:', err);
      throw err;
    }
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <StoreContext.Provider value={{
      products,
      categories,
      authors,
      banners,
      paymentMethods,
      orders,
      paymentSubmissions,
      cart,
      wishlist,
      settings,
      activePage,
      selectedProductId,
      selectedCategoryFilter,
      searchQuery,
      darkMode,
      isLoading,
      setActivePage,
      setSelectedCategoryFilter,
      setSearchQuery,
      setDarkMode,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      createOrder,
      submitPaymentProof,
      addProduct,
      updateProduct,
      deleteProduct,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      addBanner,
      updateBanner,
      deleteBanner,
      addAuthor,
      updateAuthor,
      deleteAuthor,
      addCategory,
      updateCategory,
      deleteCategory,
      updateOrderStatus,
      updateOrderPaymentStatus,
      updateOrderTracking,
      deleteOrder,
      reviewPaymentSubmission,
      updateSettings,
      reviews,
      addProductReview,
      subscribers,
      addSubscriber,
      deleteSubscriber,
      trackOrder
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
