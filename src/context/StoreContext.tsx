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
  addDoc 
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
  
  refreshData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [authors, setAuthors] = useState<Author[]>(DEFAULT_AUTHORS);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(DEFAULT_PAYMENT_METHODS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const [activePage, setActivePageState] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshData = async () => {
    try {
      await seedInitialDataIfNeeded();
      
      const prodSnap = await getDocs(collection(db, 'products'));
      if (!prodSnap.empty) {
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      }

      const catSnap = await getDocs(collection(db, 'categories'));
      if (!catSnap.empty) {
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      }

      const authSnap = await getDocs(collection(db, 'authors'));
      if (!authSnap.empty) {
        setAuthors(authSnap.docs.map(d => ({ id: d.id, ...d.data() } as Author)));
      }

      const banSnap = await getDocs(collection(db, 'banners'));
      if (!banSnap.empty) {
        setBanners(banSnap.docs.map(d => ({ id: d.id, ...d.data() } as Banner)));
      }

      const pmSnap = await getDocs(collection(db, 'payment_methods'));
      if (!pmSnap.empty) {
        setPaymentMethods(pmSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethodConfig)));
      }

      const ordSnap = await getDocs(collection(db, 'orders'));
      if (!ordSnap.empty) {
        setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      }

      const subSnap = await getDocs(collection(db, 'payment_submissions'));
      if (!subSnap.empty) {
        setPaymentSubmissions(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentSubmission)));
      }
    } catch (err: any) {
      console.warn('Using default store data due to Firestore permissions or offline state:', err?.message || err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'paymentStatus' | 'orderStatus'>): Promise<string> => {
    const orderId = 'MRB-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      paymentStatus: 'unpaid',
      orderStatus: orderData.paymentMethodId === 'cod' ? 'confirmed' : 'awaiting_payment',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return orderId;
  };

  const submitPaymentProof = async (subData: Omit<PaymentSubmission, 'id' | 'status' | 'submittedAt'>) => {
    const subId = 'SUB-' + Math.floor(100000 + Math.random() * 900000);
    const newSub: PaymentSubmission = {
      ...subData,
      id: subId,
      status: 'pending_verification',
      submittedAt: Date.now()
    };

    try {
      await setDoc(doc(db, 'payment_submissions', subId), newSub);
      await setDoc(doc(db, 'orders', subData.orderId), {
        paymentStatus: 'pending_verification',
        orderStatus: 'awaiting_payment_verification',
        paymentSubmissionId: subId,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore payment submission warning:', err);
    }

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
    } catch (err) {
      console.warn('Firestore add product warning:', err);
    }
    setProducts(prev => [newProd, ...prev]);
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      await setDoc(doc(db, 'products', id), data, { merge: true });
    } catch (err) {
      console.warn('Firestore update product warning:', err);
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      console.warn('Firestore delete product warning:', err);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPaymentMethod = async (method: PaymentMethodConfig) => {
    try {
      await setDoc(doc(db, 'payment_methods', method.id), method);
    } catch (err) {
      console.warn('Firestore add payment method warning:', err);
    }
    setPaymentMethods(prev => [...prev.filter(m => m.id !== method.id), method]);
  };

  const updatePaymentMethod = async (id: string, data: Partial<PaymentMethodConfig>) => {
    try {
      await setDoc(doc(db, 'payment_methods', id), data, { merge: true });
    } catch (err) {
      console.warn('Firestore update payment method warning:', err);
    }
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'payment_methods', id));
    } catch (err) {
      console.warn('Firestore delete payment method warning:', err);
    }
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const addBanner = async (banner: Banner) => {
    try {
      await setDoc(doc(db, 'banners', banner.id), banner);
    } catch (err) {
      console.warn('Firestore add banner warning:', err);
    }
    setBanners(prev => [...prev.filter(b => b.id !== banner.id), banner]);
  };

  const updateBanner = async (id: string, data: Partial<Banner>) => {
    try {
      await setDoc(doc(db, 'banners', id), data, { merge: true });
    } catch (err) {
      console.warn('Firestore update banner warning:', err);
    }
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
  };

  const deleteBanner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banners', id));
    } catch (err) {
      console.warn('Firestore delete banner warning:', err);
    }
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const addAuthor = async (author: Author) => {
    try {
      await setDoc(doc(db, 'authors', author.id), author);
    } catch (err) {
      console.warn('Firestore add author warning:', err);
    }
    setAuthors(prev => [...prev.filter(a => a.id !== author.id), author]);
  };

  const updateAuthor = async (id: string, data: Partial<Author>) => {
    try {
      await setDoc(doc(db, 'authors', id), data, { merge: true });
    } catch (err) {
      console.warn('Firestore update author warning:', err);
    }
    setAuthors(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const deleteAuthor = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'authors', id));
    } catch (err) {
      console.warn('Firestore delete author warning:', err);
    }
    setAuthors(prev => prev.filter(a => a.id !== id));
  };

  const addCategory = async (cat: Category) => {
    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
    } catch (err) {
      console.warn('Firestore add category warning:', err);
    }
    setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat]);
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    try {
      await setDoc(doc(db, 'categories', id), data, { merge: true });
    } catch (err) {
      console.warn('Firestore update category warning:', err);
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      console.warn('Firestore delete category warning:', err);
    }
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateOrderStatus = async (orderId: string, orderStatus: Order['orderStatus']) => {
    try {
      await setDoc(doc(db, 'orders', orderId), { orderStatus, updatedAt: Date.now() }, { merge: true });
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
      refreshData
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
