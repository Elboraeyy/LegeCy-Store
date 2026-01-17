"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import { getCurrentUser, logoutAction } from "@/lib/actions/auth";
import { fetchAllCategories } from "@/lib/actions/category";
import { toast } from "sonner";
import SearchBar from "@/components/SearchBar";
import { AnimatePresence, motion } from "framer-motion";
import { GeneralSettings, HeaderSettings } from "@/lib/settings";
import { useComparison } from "@/context/ComparisonContext";

interface NavbarProps {
  generalSettings?: GeneralSettings;
  headerSettings?: HeaderSettings;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export default function Navbar({
  generalSettings,
  headerSettings,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string; parentId: string | null }[]
  >([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const lastScrollY = React.useRef(0); // Use ref to track scroll without re-rendering effect

  const pathname = usePathname();
  const router = useRouter();
  const { cart, fav, openCart } = useStore();
  const { selectedProducts } = useComparison();
  const isClient = useIsClient();

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const favCount = fav.length;

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
    fetchAllCategories().then((cats) => {
      const parents = cats.filter((c) => !c.parentId);
      setCategories(parents);
    });

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine direction
      // Downscroll AND past threshold -> Hide
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setVisible(false); 
      } 
      // Upscroll -> Show
      else if (currentScrollY < lastScrollY.current) {
        setVisible(true);
      }

      setScrolled(currentScrollY > 20);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when sidebar is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      setUser(null);
      setShowUserMenu(false);
      toast.success("Logged out successfully");
      router.push("/");
    } catch {
      toast.error("An error occurred");
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  // Colors from globals.css
  // Dark Green: #12403C
  // Beige: #F5F0E3
  // Gold: #d4af37

  return (
    <div className="flex flex-col w-full z-50 relative">
      {/* Announcement Bar - Hides on Scroll Down */}
      <div 
        className={`transition-transform duration-300 ${!visible ? '-translate-y-full absolute' : 'translate-y-0 relative'} z-50 w-full`}
      >
        {headerSettings?.announcementEnabled && (
          <div
            className="w-full py-2 text-center text-xs font-medium tracking-wider uppercase"
            style={{
              backgroundColor: headerSettings.announcementBgColor || "#12403C",
              color: headerSettings.announcementTextColor || "#ffffff",
            }}
          >
            <div className="container mx-auto px-4">
              {headerSettings.announcementText}
            </div>
          </div>
        )}
      </div>

      {/* Main Navbar */}
      <header
        className={`w-full fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${
          scrolled
            ? "bg-[#F5F0E3]/95 backdrop-blur-md border-b border-[rgba(18,64,60,0.08)] shadow-sm py-2"
            : "bg-[#F5F0E3] border-b border-transparent py-3"
        }`}
        style={{
           marginTop: (visible && scrolled) ? 0 : (visible && headerSettings?.announcementEnabled ? 0 : 0) // Reset margin logic handling
        } as React.CSSProperties}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-50 flex-shrink-0 group flex items-center gap-2">
              {generalSettings?.logoUrl ? (
                <Image
                  src={generalSettings.logoUrl}
                  alt={generalSettings.storeName}
                  width={140}
                  height={50}
                  className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              ) : (
                <>
                  <Image
                    src="/image/logoo.png"
                    alt="Legacy"
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="text-2xl font-bold tracking-wider text-[#12403C] font-heading uppercase transition-colors">
                    LEGACY
                  </span>
                </>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 ml-8">
              <NavLink href="/" active={isActive("/")}>
                Home
              </NavLink>

              {/* Shop Dropdown */}
              <div
                className="relative group h-full flex items-center"
                onMouseEnter={() => setShowCategoryMenu(true)}
                onMouseLeave={() => setShowCategoryMenu(false)}
              >
                <NavLink
                  href="/shop"
                  active={isActive("/shop")}
                  className="flex items-center gap-1"
                >
                  Shop
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="opacity-60 group-hover:rotate-180 transition-transform duration-200"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </NavLink>



                <AnimatePresence>
                  {showCategoryMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden py-2"
                    >
                      <Link
                        href="/shop"
                        className="block px-6 py-3 text-sm text-[#12403C] hover:bg-[#F5F0E3] hover:text-[#d4af37] transition-colors font-medium"
                      >
                        All Products
                      </Link>
                      <div className="h-px bg-gray-100 mx-4 my-1"></div>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/shop?category=${cat.slug}`}
                            className="block px-6 py-2.5 text-sm text-gray-600 hover:text-[#12403C] hover:bg-gray-50 transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))
                      ) : (
                        <span className="block px-6 py-3 text-sm text-gray-400">
                          No categories found
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink href="/about" active={isActive("/about")}>
                About
              </NavLink>
              <NavLink href="/help" active={isActive("/help")}>
                Help
              </NavLink>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              {(headerSettings?.showSearch ?? true) && <SearchBar />}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              {/* Search Trigger (Mobile) */}
              <button
                className="lg:hidden p-1 lg:p-2 text-[#12403C] hover:text-[#d4af37] transition-colors"
                onClick={() => setShowMobileSearch(!showMobileSearch)}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>

              {/* Wishlist */}
              {(headerSettings?.showWishlist ?? true) && (
                <Link
                  href="/wishlist"
                  className="relative p-1 lg:p-2 text-[#12403C] hover:text-[#d4af37] transition-colors group"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:fill-current/10 transition-colors"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {isClient && favCount > 0 && (
                    <span className="absolute top-0 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4af37] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {favCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Compare Icon */}
              <Link
                href="/compare"
                className="relative p-1 lg:p-2 text-[#12403C] hover:text-[#d4af37] transition-colors group"
                title="Compare"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:stroke-[#d4af37] transition-colors"
                >
                  <path d="M8 3 4 7 8 11" />
                  <path d="M4 7 h16" />
                  <path d="m16 21 4-4-4-4" />
                  <path d="M20 17 H4" />
                </svg>
                {isClient && selectedProducts.length > 0 && (
                  <span className="absolute top-0 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4af37] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {selectedProducts.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              {(headerSettings?.showCart ?? true) && (
                <button
                  onClick={openCart}
                  className="relative p-1 lg:p-2 text-[#12403C] hover:text-[#d4af37] transition-colors group"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {isClient && cartCount > 0 && (
                    <span className="absolute top-0 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#12403C] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Menu */}
              {isClient && (headerSettings?.showAccount ?? true) && (
                <div className="hidden lg:block relative">
                  {user ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                      >
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name || 'User'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#12403C] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                              {user.name?.charAt(0).toUpperCase() ||
                                user.email.charAt(0).toUpperCase()}
                            </div>
                        )}
                      </button>

                      <AnimatePresence>
                        {showUserMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 p-2"
                          >
                            <div className="px-4 py-3 bg-gray-50/50 rounded-xl mb-1">
                              <p className="text-sm font-semibold text-[#12403C] truncate">
                                {user.name || "User"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                              </p>
                            </div>

                            <div className="space-y-px">
                              <Link
                                href="/account"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F0E3] hover:text-[#12403C] rounded-lg transition-colors"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                My Account
                              </Link>
                              <Link
                                href="/account/orders"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F0E3] hover:text-[#12403C] rounded-lg transition-colors"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                  />
                                  <path d="M3 9h18" />
                                  <path d="M9 21V9" />
                                </svg>
                                My Orders
                              </Link>
                              <div className="my-1 h-px bg-gray-100" />
                              <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                  <polyline points="16 17 21 12 16 7" />
                                  <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Sign Out
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#12403C] text-white rounded-full text-sm font-medium hover:bg-[#0e3330] hover:shadow-lg hover:shadow-[#12403C]/20 transition-all transform hover:-translate-y-0.5"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-1 lg:p-2 -mr-1 lg:-mr-2 text-[#12403C]"
                onClick={() => setIsOpen(true)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Spacer to prevent content overlap */}
      <div 
        className="w-full relative -z-50 pointer-events-none" 
        style={{ height: headerSettings?.announcementEnabled ? '80px' : '56px' }} 
      />

      {/* Mobile Search Dropdown */}
      <AnimatePresence>
        {showMobileSearch && (
          <>
            {/* Backdrop to close on click outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSearch(false)}
              className="fixed inset-0 z-[54] lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-[60px] left-0 right-0 z-[55] bg-[#F5F0E3] shadow-lg border-b border-[rgba(18,64,60,0.1)] p-4 lg:hidden"
            >
              <SearchBar onProductSelect={() => setShowMobileSearch(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />

            {/* Drawer - Redesigned */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.05, right: 0.3 }}
              dragDirectionLock
              onDragEnd={(_, info) => {
                // Close on swipe right (positive x direction) with lower threshold
                if (info.offset.x > 50 || info.velocity.x > 300) {
                  setIsOpen(false);
                }
              }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-[#F5F0E3] z-[70] shadow-2xl flex flex-col touch-pan-y rounded-l-[20px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[rgba(18,64,60,0.1)]">
                <span className="text-lg font-bold font-heading text-[#12403C] uppercase tracking-wider">
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#12403C] hover:text-[#d4af37] bg-white/50 rounded-full transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Profile Section - Clickable to go to Account */}
              {user && (
                <Link 
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="block p-5 bg-[#12403C] text-white hover:bg-[#0e3330] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={48}
                        height={48}
                        className="w-12 h-12 min-w-[48px] min-h-[48px] flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                        <div className="w-12 h-12 min-w-[48px] min-h-[48px] flex-shrink-0 aspect-square rounded-full bg-[#d4af37] text-[#12403C] flex items-center justify-center text-xl font-bold">
                          {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                      <p className="font-semibold text-base">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs opacity-70">{user.email}</p>
                    </div>
                    <svg className="ml-auto opacity-50" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </Link>
              )}

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto p-5">
                <nav className="flex flex-col space-y-1">
                  <MobileNavLink href="/" onClick={() => setIsOpen(false)}>
                    Home
                  </MobileNavLink>
                  <MobileNavLink href="/shop" onClick={() => setIsOpen(false)}>
                    Shop
                  </MobileNavLink>
                  <div className="pl-4 border-l-2 border-[#12403C]/20 ml-3 space-y-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/shop?category=${cat.slug}`}
                        className="block text-sm text-[#12403C]/70 hover:text-[#12403C] py-1"
                        onClick={() => setIsOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                  <MobileNavLink href="/about" onClick={() => setIsOpen(false)}>
                    About
                  </MobileNavLink>
                  <MobileNavLink href="/help" onClick={() => setIsOpen(false)}>
                    Help
                  </MobileNavLink>
                  <MobileNavLink href="/compare" onClick={() => setIsOpen(false)}>
                    <div className="flex items-center gap-2">
                      Compare
                      {selectedProducts.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4af37] text-xs font-bold text-white">
                          {selectedProducts.length}
                        </span>
                      )}
                    </div>
                  </MobileNavLink>
                </nav>

                {/* Account Links */}
                {user ? (
                  <div className="border-t border-[#12403C]/10 pt-4 mt-4 space-y-1">
                    <MobileNavLink
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      }
                    >
                      My Account
                    </MobileNavLink>
                    <MobileNavLink
                      href="/account/orders"
                      onClick={() => setIsOpen(false)}
                      icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18" />
                          <path d="M9 21V9" />
                        </svg>
                      }
                    >
                      My Orders
                    </MobileNavLink>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 w-full text-left text-red-500 font-medium py-3 px-1 hover:bg-red-50/50 rounded-lg transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-[#12403C]/10 pt-4 mt-4">
                    <Link
                      href="/login"
                      className="block w-full py-3 bg-[#12403C] text-white text-center rounded-xl font-medium shadow-lg shadow-[#12403C]/20"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              {/* Swipe hint */}
              <div className="p-4 text-center text-xs text-[#12403C]/50">
                Swipe right to close
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
  className = "",
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`
                text-sm font-medium tracking-wide uppercase transition-all duration-300 relative py-2
                ${active ? "text-[#12403C]" : "text-gray-500 hover:text-[#12403C]"}
                ${className}
            `}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-[2px] bg-[#d4af37] transition-all duration-300 ${active ? "w-full" : "w-0 group-hover:w-full"}`}
      ></span>
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
  icon,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 text-base font-medium text-[#12403C] py-3 px-1 rounded-lg hover:bg-[#12403C]/5 transition-all"
    >
      {icon && <span className="text-[#12403C]/60">{icon}</span>}
      {children}
    </Link>
  );
}
