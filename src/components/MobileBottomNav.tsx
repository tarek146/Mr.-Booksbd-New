import React from 'react';
import { useStore } from '../context/StoreContext';
import { Home, ShoppingBag, ShoppingCart, Truck, PenTool } from 'lucide-react';

export function MobileBottomNav() {
  const { activePage, setActivePage, cart } = useStore();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      page: 'home'
    },
    {
      id: 'books',
      label: 'Shop Books',
      icon: ShoppingBag,
      page: 'books'
    },
    {
      id: 'stationery',
      label: 'Stationery',
      icon: PenTool,
      page: 'stationery'
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      page: 'cart',
      badge: totalCartItems
    },
    {
      id: 'my-orders',
      label: 'My Orders',
      icon: Truck,
      page: 'my-orders'
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-2 py-1.5 transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page || (item.page === 'books' && activePage === 'shop');

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.page)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#D71920] font-black' 
                  : 'text-neutral-500 hover:text-neutral-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon 
                  size={20} 
                  className={`transition-transform duration-200 ${isActive ? 'scale-110 text-[#D71920]' : ''}`} 
                  strokeWidth={isActive ? 2.5 : 1.8}
                />

                {/* Badge Count */}
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#D71920] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-2xs border border-white animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-[#D71920]' : 'font-semibold text-neutral-600'}`}>
                {item.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute -bottom-1 w-5 h-0.5 bg-[#D71920] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
