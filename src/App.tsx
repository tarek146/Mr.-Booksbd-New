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
import { AdminDashboard } from './pages/AdminDashboard';

function MainRouter() {
  const { activePage } = useStore();

  // Standalone Isolated Admin Application
  // Completely separated from storefront: no consumer Navbar, no Footer, no MobileBottomNav
  if (activePage === 'admin') {
    return <AdminDashboard />;
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
