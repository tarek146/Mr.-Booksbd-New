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
  const { activePage } = useStore();

  // Standalone Isolated Admin Application
  // Completely separated from storefront: no consumer Navbar, no Footer, no MobileBottomNav
  if (activePage === 'admin') {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center text-white p-6">
          <div className="w-12 h-12 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-xs uppercase tracking-wider text-slate-400">Loading Management Suite...</span>
        </div>
      }>
        <AdminDashboard />
      </React.Suspense>
    );
  }

  return (
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
