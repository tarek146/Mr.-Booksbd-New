import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { PaymentMethodConfig, Product, Category, Author, Banner, StoreSettings } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyBtri4I2GZXlKuZTf_aOIV5TbmgV0VMQI0",
  authDomain: "mr-book-new.firebaseapp.com",
  projectId: "mr-book-new",
  storageBucket: "mr-book-new.firebasestorage.app",
  messagingSenderId: "358143706074",
  appId: "1:358143706074:web:d4337f5a9cd8cf8d02b6e3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const ADMIN_UID = 'ytewGIOO2uhISkUfUUwktSvzdjy1';
export const ADMIN_EMAIL = 'mr.booksbd700@gmail.com';

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'bkash-personal',
    name: 'bKash Personal',
    type: 'bkash',
    accountName: 'MR. BOOKS Official',
    accountNumber: '01712345678',
    accountType: 'Personal',
    instructions: '1. Go to your bKash app or dial *247#.\n2. Choose "Send Money".\n3. Enter receiver number: 01712345678.\n4. Enter exact amount.\n5. Save the Transaction ID (TrxID) and enter it below.',
    isActive: true,
    displayOrder: 1,
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'nagad-personal',
    name: 'Nagad Personal',
    type: 'nagad',
    accountName: 'MR. BOOKS BD',
    accountNumber: '01812345678',
    accountType: 'Personal',
    instructions: '1. Open Nagad App or dial *167#.\n2. Select Send Money.\n3. Enter account number: 01812345678.\n4. Enter amount and PIN.\n5. Copy Transaction ID (TrxID) after confirmation.',
    isActive: true,
    displayOrder: 2,
    logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'rocket-personal',
    name: 'Rocket Mobile',
    type: 'rocket',
    accountName: 'MR. BOOKS Account',
    accountNumber: '019123456789',
    accountType: 'Personal',
    instructions: '1. Dial *322# or use Rocket App.\n2. Select Send Money.\n3. Enter account number: 019123456789.\n4. Enter amount and enter PIN.\n5. Save Txn ID.',
    isActive: true,
    displayOrder: 3
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer (DBBL / EBL)',
    type: 'bank',
    accountName: 'MR. BOOKS ENTERPRISE',
    accountNumber: '123-110-456789',
    bankName: 'Eastern Bank PLC',
    branchName: 'Gulshan Branch, Dhaka',
    routingNumber: '095261234',
    instructions: 'Transfer the exact order amount to our Eastern Bank account.\nAccount Name: MR. BOOKS ENTERPRISE\nA/C No: 123-110-456789\nRouting: 095261234\nUpload bank receipt or transaction reference after payment.',
    isActive: true,
    displayOrder: 4
  },
  {
    id: 'cod',
    name: 'Cash on Delivery (COD)',
    type: 'cod',
    accountName: 'Cash on Delivery',
    accountNumber: 'N/A',
    instructions: 'Pay with cash when your book or stationery package is delivered to your doorstep. (Available across Bangladesh)',
    isActive: true,
    displayOrder: 5
  }
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-fiction', name: 'Fiction & Literature', slug: 'fiction-literature', type: 'book', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-islamic', name: 'Islamic Books', slug: 'islamic-books', type: 'book', image: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-academic', name: 'Academic & University', slug: 'academic-university', type: 'book', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-novel', name: 'Bangla Novels & Poetry', slug: 'bangla-novels-poetry', type: 'book', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-thriller', name: 'Thriller & Mystery', slug: 'thriller-mystery', type: 'book', image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-children', name: 'Children & Comics', slug: 'children-comics', type: 'book', image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-pens', name: 'Pens & Calligraphy', slug: 'pens-pencils', type: 'stationery', image: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-notebooks', name: 'Notebooks & Diaries', slug: 'notebooks-diaries', type: 'stationery', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-art', name: 'Art & Craft Supplies', slug: 'art-craft-supplies', type: 'stationery', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80', showOnHome: true },
  { id: 'cat-desk', name: 'Desk & Office Supplies', slug: 'desk-organizers', type: 'stationery', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80', showOnHome: true }
];

export const DEFAULT_AUTHORS: Author[] = [
  { 
    id: 'auth-humayun', 
    name: 'Humayun Ahmed', 
    bio: 'Legendary Bangladeshi author, dramatist, and filmmaker known for his beloved character Himu and Misir Ali.', 
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
    booksCount: 42 
  },
  { 
    id: 'auth-zafrullah', 
    name: 'Dr. Muhammad Zafar Iqbal', 
    bio: 'Renowned physicist, writer, and science fiction pioneer in Bangladesh.', 
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    booksCount: 28 
  },
  { 
    id: 'auth-sarat', 
    name: 'Sarat Chandra Chattopadhyay', 
    bio: 'Classic Bengali novelist known for Devdas, Parineeta, and timeless human portraits.', 
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    booksCount: 15 
  },
  { 
    id: 'auth-arif', 
    name: 'Arif Azad', 
    bio: 'Bestselling contemporary non-fiction author of Paradoxical Sajid.', 
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    booksCount: 5 
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    type: 'book',
    title: 'Paradoxical Sajid 2',
    slug: 'paradoxical-sajid-2',
    description: 'Bestselling Islamic apologetics and philosophical responses by Arif Azad. Explores complex questions of faith, science, and existence.',
    category: 'Islamic Books',
    author: 'Arif Azad',
    publisher: 'Guardian Publications',
    isbn: '9789849312341',
    language: 'Bengali',
    pages: 264,
    edition: '3rd Edition',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80'
    ],
    price: 350,
    previousPrice: 420,
    stock: 120,
    sku: 'BK-PS2-01',
    variants: [
      { id: 'v1', name: 'Paperback', price: 350, previousPrice: 420, stock: 80, sku: 'BK-PS2-PB' },
      { id: 'v2', name: 'Hardcover', price: 480, previousPrice: 550, stock: 40, sku: 'BK-PS2-HC' },
      { id: 'v3', name: 'Premium Print', price: 520, previousPrice: 600, stock: 30, sku: 'BK-PS2-PR' }
    ],
    rating: 4.9,
    reviewCount: 342,
    isFeatured: true,
    isOriginalBadge: true,
    deliveryEstimate: '2-3 Days across Bangladesh',
    createdAt: Date.now()
  },
  {
    id: 'prod-2',
    type: 'book',
    title: 'Himu Omnibus (Volume 1)',
    slug: 'himu-omnibus-1',
    description: 'The iconic yellow-punjabi wearing bohemian character created by Humayun Ahmed. Contains multiple classic Himu novels.',
    category: 'Fiction & Literature',
    author: 'Humayun Ahmed',
    publisher: 'Anyaprokash',
    isbn: '9789848680123',
    language: 'Bengali',
    pages: 480,
    edition: 'Anniversary Edition',
    images: [
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=600&auto=format&fit=crop&q=80'
    ],
    price: 650,
    previousPrice: 750,
    stock: 50,
    sku: 'BK-HIMU-01',
    variants: [
      { id: 'v1', name: 'Paperback', price: 550, previousPrice: 650, stock: 30, sku: 'BK-HIMU-PB' },
      { id: 'v2', name: 'Hardcover', price: 650, previousPrice: 750, stock: 50, sku: 'BK-HIMU-HC' },
      { id: 'v3', name: 'Regular Print', price: 480, previousPrice: 580, stock: 20, sku: 'BK-HIMU-RP' }
    ],
    rating: 4.8,
    reviewCount: 189,
    isFeatured: true,
    isOriginalBadge: true,
    deliveryEstimate: '2-3 Days',
    createdAt: Date.now()
  },
  {
    id: 'prod-3',
    type: 'book',
    title: 'Amar Bondhu Rashed',
    slug: 'amar-bondhu-rashed',
    description: 'A deeply moving children and young adult novel about the Liberation War of Bangladesh by Dr. Muhammad Zafar Iqbal.',
    category: 'Bangla Novels & Poetry',
    author: 'Dr. Muhammad Zafar Iqbal',
    publisher: 'Tamralipi',
    isbn: '9789847012345',
    language: 'Bengali',
    pages: 140,
    edition: 'Standard Print',
    images: [
      'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'
    ],
    price: 220,
    previousPrice: 250,
    stock: 90,
    sku: 'BK-ABR-01',
    variants: [
      { id: 'v1', name: 'Paperback', price: 220, previousPrice: 250, stock: 90, sku: 'BK-ABR-PB' },
      { id: 'v2', name: 'Hardcover', price: 320, previousPrice: 380, stock: 40, sku: 'BK-ABR-HC' },
      { id: 'v3', name: 'Premium Print', price: 360, previousPrice: 420, stock: 25, sku: 'BK-ABR-PR' }
    ],
    rating: 4.7,
    reviewCount: 95,
    isFeatured: true,
    isOriginalBadge: true,
    deliveryEstimate: '2-3 Days',
    createdAt: Date.now()
  },
  {
    id: 'prod-4',
    type: 'stationery',
    title: 'Premium Leather Bound Executive Diary 2026',
    slug: 'premium-leather-diary-2026',
    description: 'A5 size professional notebook with 200 GSM acid-free cream pages, bookmark ribbon, and secure elastic band.',
    category: 'Notebooks & Diaries',
    brand: 'Moleskine / MR. BOOKS',
    images: [
      'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80'
    ],
    price: 450,
    previousPrice: 550,
    stock: 200,
    sku: 'ST-DIARY-26',
    variants: [
      { id: 'v1', name: 'Classic Black A5', price: 450, previousPrice: 550, stock: 120, sku: 'ST-DIARY-BLK' },
      { id: 'v2', name: 'Royal Brown A5', price: 480, previousPrice: 580, stock: 80, sku: 'ST-DIARY-BRN' }
    ],
    rating: 4.9,
    reviewCount: 120,
    isFeatured: true,
    isOriginalBadge: true,
    deliveryEstimate: '2-3 Days',
    createdAt: Date.now()
  },
  {
    id: 'prod-5',
    type: 'stationery',
    title: 'Fountain Pen & Calligraphy Gift Set',
    slug: 'fountain-pen-calligraphy-set',
    description: 'Exquisite metal body fountain pen with 5 colored ink cartridges and 3 interchangeable nibs in a wooden gift box.',
    category: 'Pens & Calligraphy',
    brand: 'Schneider / Pilot',
    images: [
      'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80'
    ],
    price: 850,
    previousPrice: 1050,
    stock: 65,
    sku: 'ST-PEN-SET',
    variants: [
      { id: 'v1', name: 'Golden Nib Set', price: 850, previousPrice: 1050, stock: 35, sku: 'ST-PEN-GOLD' },
      { id: 'v2', name: 'Silver Steel Set', price: 850, previousPrice: 1050, stock: 30, sku: 'ST-PEN-SILV' }
    ],
    rating: 4.8,
    reviewCount: 78,
    isFeatured: true,
    isOriginalBadge: true,
    deliveryEstimate: '2-3 Days',
    createdAt: Date.now()
  }
];

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'Dhaka Book Fair Special Discount',
    subtitle: 'Get up to 35% OFF on Bestselling Novels, Islamic Books & University Textbooks!',
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1600&auto=format&fit=crop&q=85',
    linkUrl: '/books',
    buttonText: 'Explore Books',
    showText: false,
    showButton: false,
    buttonPosition: 'bottom-left',
    isActive: true,
    displayOrder: 1
  }
];

// Demo data insertion is disabled to enforce strict production data integrity (No mock/fake data)
export async function seedInitialDataIfNeeded() {
  // Safe no-op in production. Real products and categories are managed via Admin Console.
}
