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
  StoreSettings 
} from '../types';
import { 
  db, 
  seedInitialDataIfNeeded, 
  DEFAULT_PRODUCTS, 
  DEFAULT_CATEGORIES, 
  DEFAULT_AUTHORS, 
  DEFAULT_BANNERS, 
  DEFAULT_PAYMENT_METHODS 
} from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

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
  reviewPaymentSubmission: (subId: string, status: 'approved' | 'rejected', reason?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
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
  
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [authors, setAuthors] = useState<Author[]>(DEFAULT_AUTHORS);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(DEFAULT_PAYMENT_METHODS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const initialRoute = getPageFromLocation();
  const [activePage, setActivePageState] = useState<string>(initialRoute.page);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productId);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [darkMode] = useState<boolean>(false);
  const setDarkMode = (_dark: boolean) => {};
  
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
    nagadNumber: '01812345678'
  });

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



  // 1. Public catalog collections: Products, Categories, Authors, Banners, Payment Methods, Settings
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        }
      },
      (err) => {
        console.warn('Products listener notice:', err.message);
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        }
      },
      (err) => {
        console.warn('Categories listener notice:', err.message);
      }
    );

    const unsubAuthors = onSnapshot(
      collection(db, 'authors'),
      (snapshot) => {
        if (!snapshot.empty) {
          setAuthors(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Author)));
        }
      },
      (err) => {
        console.warn('Authors listener notice:', err.message);
      }
    );

    const unsubBanners = onSnapshot(
      collection(db, 'banners'),
      (snapshot) => {
        if (!snapshot.empty) {
          setBanners(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
        }
      },
      (err) => {
        console.warn('Banners listener notice:', err.message);
      }
    );

    const unsubPayments = onSnapshot(
      collection(db, 'payment_methods'),
      (snapshot) => {
        if (!snapshot.empty) {
          setPaymentMethods(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethodConfig)));
        }
      },
      (err) => {
        console.warn('Payments listener notice:', err.message);
      }
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (snap) => {
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() } as StoreSettings));
        }
      },
      (err) => {
        console.warn('Settings listener notice:', err.message);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubAuthors();
      unsubBanners();
      unsubPayments();
      unsubSettings();
    };
  }, []);

  // 2. Auth-aware protected listeners: Orders & Payment Submissions
  // Prevents anonymous/customer permission-denied errors and protects customer privacy
  useEffect(() => {
    let unsubOrders: (() => void) | null = null;
    let unsubSubs: (() => void) | null = null;

    if (isAdmin) {
      // Administrator: Real-time sync for all orders and payment verification queues
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
      await setDoc(doc(db, 'products', id), newProd);
      await logAdminAction('product_created', id, `Added product: ${newProd.title} (Price: ৳${newProd.price})`);
    } catch (err) {
      console.warn('Firestore add product warning:', err);
    }
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await setDoc(doc(db, 'products', id), data, { merge: true });
      await logAdminAction('product_updated', id, `Updated product fields: ${Object.keys(data).join(', ')}`);
    } catch (err) {
      console.warn('Firestore update product warning:', err);
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      await logAdminAction('product_deleted', id, `Deleted product id: ${id}`);
    } catch (err) {
      console.warn('Firestore delete product warning:', err);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPaymentMethod = async (method: PaymentMethodConfig) => {
    try {
      await setDoc(doc(db, 'payment_methods', method.id), method);
      await logAdminAction('payment_method_created', method.id, `Added payment method: ${method.name}`);
    } catch (err) {
      console.warn('Firestore add payment method warning:', err);
    }
    setPaymentMethods(prev => [...prev.filter(m => m.id !== method.id), method]);
  };

  const updatePaymentMethod = async (id: string, data: Partial<PaymentMethodConfig>) => {
    try {
      await setDoc(doc(db, 'payment_methods', id), data, { merge: true });
      await logAdminAction('payment_method_updated', id, `Updated payment method: ${id}`);
    } catch (err) {
      console.warn('Firestore update payment method warning:', err);
    }
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payment_methods', id));
      await logAdminAction('payment_method_deleted', id, `Deleted payment method: ${id}`);
    } catch (err) {
      console.warn('Firestore delete payment method warning:', err);
    }
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const addBanner = async (banner: Banner) => {
    try {
      await setDoc(doc(db, 'banners', banner.id), banner);
      await logAdminAction('banner_created', banner.id, `Added banner: ${banner.title}`);
    } catch (err) {
      console.warn('Firestore add banner warning:', err);
    }
    setBanners(prev => [...prev.filter(b => b.id !== banner.id), banner]);
  };

  const updateBanner = async (id: string, data: Partial<Banner>) => {
    try {
      await setDoc(doc(db, 'banners', id), data, { merge: true });
      await logAdminAction('banner_updated', id, `Updated banner: ${id}`);
    } catch (err) {
      console.warn('Firestore update banner warning:', err);
    }
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
      await logAdminAction('banner_deleted', id, `Deleted banner: ${id}`);
    } catch (err) {
      console.warn('Firestore delete banner warning:', err);
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const addAuthor = async (author: Author) => {
    try {
      await setDoc(doc(db, 'authors', author.id), author);
      await logAdminAction('author_created', author.id, `Added author: ${author.name}`);
    } catch (err) {
      console.warn('Firestore add author warning:', err);
    }
    setAuthors(prev => [...prev.filter(a => a.id !== author.id), author]);
  };

  const updateAuthor = async (id: string, data: Partial<Author>) => {
    try {
      await setDoc(doc(db, 'authors', id), data, { merge: true });
      await logAdminAction('author_updated', id, `Updated author: ${id}`);
    } catch (err) {
      console.warn('Firestore update author warning:', err);
    }
    setAuthors(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAuthor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'authors', id));
      await logAdminAction('author_deleted', id, `Deleted author: ${id}`);
    } catch (err) {
      console.warn('Firestore delete author warning:', err);
    }
    setAuthors(prev => prev.filter(a => a.id !== id));
  };

  const addCategory = async (cat: Category) => {
    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
      await logAdminAction('category_created', cat.id, `Added category: ${cat.name}`);
    } catch (err) {
      console.warn('Firestore add category warning:', err);
    }
    setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat]);
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      await setDoc(doc(db, 'categories', id), data, { merge: true });
      await logAdminAction('category_updated', id, `Updated category: ${id}`);
    } catch (err) {
      console.warn('Firestore update category warning:', err);
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      await logAdminAction('category_deleted', id, `Deleted category: ${id}`);
    } catch (err) {
      console.warn('Firestore delete category warning:', err);
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateOrderStatus = async (orderId: string, orderStatus: Order['orderStatus']) => {
    try {
      await setDoc(doc(db, 'orders', orderId), { orderStatus, updatedAt: Date.now() }, { merge: true });
      await logAdminAction('order_status_updated', orderId, `Changed status to: ${orderStatus}`);
    } catch (err) {
      console.warn('Firestore update order status warning:', err);
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus, updatedAt: Date.now() } : o));
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
      await setDoc(doc(db, 'payment_submissions', subId), subUpdate, { merge: true });

      const newOrderStatus: Order['orderStatus'] = status === 'approved' ? 'confirmed' : 'awaiting_payment';
      const newPaymentStatus: Order['paymentStatus'] = status === 'approved' ? 'approved' : 'rejected';

      await setDoc(doc(db, 'orders', sub.orderId), {
        paymentStatus: newPaymentStatus,
        orderStatus: newOrderStatus,
        updatedAt: reviewedAt
      }, { merge: true });

      await logAdminAction(
        'payment_submission_reviewed', 
        subId, 
        `Payment ${status} for Order #${sub.orderId} (Amount: ৳${sub.claimedAmount}${reason ? `, Reason: ${reason}` : ''})`
      );
    } catch (err) {
      console.warn('Firestore review payment warning:', err);
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
      await setDoc(doc(db, 'settings', 'general'), newSettings, { merge: true });
      await logAdminAction('settings_updated', 'general', `Updated settings fields: ${Object.keys(newSettings).join(', ')}`);
    } catch (err) {
      console.warn('Firestore update settings warning:', err);
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
      reviewPaymentSubmission,
      updateSettings
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
