import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Home } from './pages/Home';
import { BooksPage } from './pages/BooksPage';
import { StationeryPage } from './pages/StationeryPage';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AuthorsPage } from './pages/AuthorsPage';

// Code-split AdminDashboard so customers don't download admin code on homepage
const AdminDashboard = React.lazy(() => 
  import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard }))
);

function MainRouter() {
  const { activePage, isLoading } = useStore();

  return (
    <>
      {/* Full-Screen Branded Splash Loading Screen during Initial Data Sync */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center select-none transition-opacity duration-300">
          <div className="w-16 h-16 bg-[#D71920] text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg mb-4 animate-bounce">
            MB
          </div>
          <h2 className="text-xl font-bold text-[#171717] tracking-tight mb-1">MR. BOOKS</h2>
          <p className="text-xs text-slate-500 mb-6">Online Bookstore & Stationery Partner in Bangladesh</p>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-[#FFF1F2] border border-[#FEE2E2] rounded-full text-[#D71920] text-xs font-semibold shadow-xs animate-pulse">
            <div className="w-4 h-4 border-2 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
            <span>Synchronizing live banners, logo & store data from Firebase...</span>
          </div>
        </div>
      )}

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
        <div className="bg-white text-[#171717] min-h-screen flex flex-col font-sans antialiased selection:bg-[#FFF1F2] selection:text-[#D71920] pb-14 md:pb-0">
          <Navbar />
          <main className="flex-1 bg-white">
            {activePage === 'home' && <Home />}
            {(activePage === 'books' || activePage === 'shop') && <BooksPage />}
            {activePage === 'stationery' && <StationeryPage />}
            {activePage === 'product-detail' && <ProductDetail />}
            {activePage === 'cart' && <CartPage />}
            {activePage === 'checkout' && <CheckoutPage />}
            {activePage === 'order-success' && <OrderSuccessPage />}
            {activePage === 'my-orders' && <MyOrdersPage />}
            {activePage === 'authors' && <AuthorsPage />}
          </main>
          <Footer />
          <MobileBottomNav />
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
