import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Home } from './pages/Home';
import { LiveChatWidget } from './components/LiveChatWidget';
import { CouponPromoPopup } from './components/CouponPromoPopup';
import { BooksCatalogSkeleton, ProductDetailSkeleton, AuthorsPageSkeleton, PublishersPageSkeleton, OrdersPageSkeleton } from './components/SkeletonScreens';

// Code-split secondary routes and AdminDashboard for tiny initial homepage bundle & faster boot
const BooksPage = React.lazy(() => import('./pages/BooksPage').then(m => ({ default: m.BooksPage })));
const StationeryPage = React.lazy(() => import('./pages/StationeryPage').then(m => ({ default: m.StationeryPage })));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const CartPage = React.lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const MyOrdersPage = React.lazy(() => import('./pages/MyOrdersPage').then(m => ({ default: m.MyOrdersPage })));
const AuthorsPage = React.lazy(() => import('./pages/AuthorsPage').then(m => ({ default: m.AuthorsPage })));
const PublishersPage = React.lazy(() => import('./pages/PublishersPage').then(m => ({ default: m.PublishersPage })));
const TrackOrderPage = React.lazy(() => import('./pages/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));

const AdminDashboard = React.lazy(() => 
  import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

function RouteLoadingFallback({ page }: { page: string }) {
  if (page === 'product-detail') return <ProductDetailSkeleton />;
  if (page === 'authors') return <AuthorsPageSkeleton />;
  if (page === 'publishers') return <PublishersPageSkeleton />;
  if (page === 'my-orders' || page === 'track-order') return <OrdersPageSkeleton />;
  return <BooksCatalogSkeleton />;
}

function MainRouter() {
  const { activePage } = useStore();

  return (
    <>
      {/* Standalone Isolated Admin Application */}
      {activePage === 'admin' ? (
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-white p-6">
            <div className="w-12 h-12 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Loading Management Suite...</span>
          </div>
        }>
          <AdminDashboard />
        </React.Suspense>
      ) : (
        <div className="bg-white dark:bg-[#0B0F17] text-[#171717] dark:text-[#F8FAFC] min-h-screen flex flex-col font-sans antialiased selection:bg-[#FFF1F2] selection:text-[#D71920] pb-14 md:pb-0 transition-colors duration-200">
          <Navbar />
          <main className="flex-1 bg-white dark:bg-[#0B0F17] transition-colors duration-200">
            {activePage === 'home' ? (
              <Home />
            ) : (
              <React.Suspense fallback={<RouteLoadingFallback page={activePage} />}>
                {(activePage === 'books' || activePage === 'shop') && <BooksPage />}
                {activePage === 'stationery' && <StationeryPage />}
                {activePage === 'product-detail' && <ProductDetail />}
                {activePage === 'cart' && <CartPage />}
                {activePage === 'checkout' && <CheckoutPage />}
                {activePage === 'order-success' && <OrderSuccessPage />}
                {activePage === 'my-orders' && <MyOrdersPage />}
                {activePage === 'authors' && <AuthorsPage />}
                {activePage === 'publishers' && <PublishersPage />}
                {activePage === 'track-order' && <TrackOrderPage />}
              </React.Suspense>
            )}
          </main>
          <Footer />
          <MobileBottomNav />
          <LiveChatWidget />
          <CouponPromoPopup />
        </div>
      )}
    </>
  );
}

export function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <MainRouter />
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
