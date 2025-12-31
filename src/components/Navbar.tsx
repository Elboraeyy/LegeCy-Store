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

import { GeneralSettings, HeaderSettings } from "@/lib/settings";

interface NavbarProps {
    generalSettings?: GeneralSettings;
    headerSettings?: HeaderSettings;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
}

export default function Navbar({ generalSettings, headerSettings }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; parentId: string | null }[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { cart, fav, openCart } = useStore();
  const isClient = useIsClient();


  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const favCount = fav.length;

  // Fetch user and categories on mount
  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
    fetchAllCategories().then(cats => {
         // Filter for parents (parentId is null)
         const parents = cats.filter(c => !c.parentId);
         setCategories(parents);
    });
  }, []);

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
      if (path === '/' && pathname === '/') return true;
      if (path !== '/' && pathname?.startsWith(path)) return true;
      return false;
  };

  return (
    <header className="site-header">
        {headerSettings?.announcementEnabled && (
            <div 
                className="announcement-bar"
                style={{ backgroundColor: headerSettings.announcementBgColor || '#1a3c34' }}
            >
                <div className="container">
                    <p>{headerSettings.announcementText}</p>
                </div>
            </div>
        )}
      <nav className="navbar container" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Home">
            {generalSettings?.logoUrl ? (
                <Image 
                    src={generalSettings.logoUrl} 
                    alt={generalSettings.storeName} 
                    className="brand-logo"
                    width={120}
                    height={40}
                    style={{ maxHeight: '40px', width: 'auto' }}
                />
            ) : (
                <span className="brand-text">{generalSettings?.storeName || 'Legacy'}</span>
            )}
        </Link>
        
        {/* Search Bar - Desktop Only */}
        {(headerSettings?.showSearch ?? true) && (
            <div className="nav-search-wrapper">
            <SearchBar />
            </div>
        )}
        
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`nav-links ${isOpen ? "open" : ""}`} role="menubar">
          {/* Mobile Search - Only visible in mobile menu */}
          {(headerSettings?.showSearch ?? true) && (
            <li role="none" className="mobile-search-item">
              <SearchBar />
            </li>
          )}
          <li role="none">
            <Link
              role="menuitem"
              href="/"
              className={isActive("/") ? "active" : ""}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
          </li>
          <li role="none" 
              className="nav-item-dropdown"
              onMouseEnter={() => setShowCategoryMenu(true)}
              onMouseLeave={() => setShowCategoryMenu(false)}
          >
            <Link
              role="menuitem"
              href="/shop"
              className={isActive("/shop") ? "active" : ""}
              onClick={() => setIsOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Shop
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </Link>
            
            {/* Dropdown Menu */}
            <div className={`nav-dropdown-menu ${showCategoryMenu ? 'visible' : ''}`}>
                 <Link href="/shop" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    All Products
                 </Link>
                 <div className="dropdown-divider"></div>
                 {categories.map(cat => (
                     <Link 
                        key={cat.id} 
                        href={`/shop?category=${cat.slug}`} 
                        className="dropdown-item"
                        onClick={() => setIsOpen(false)}
                     >
                        {cat.name}
                     </Link>
                 ))}
                 {categories.length === 0 && (
                    <span className="dropdown-item" style={{ color: '#999', cursor: 'default' }}>No categories</span>
                 )}
            </div>
          </li>
          {(headerSettings?.showWishlist ?? true) && (
              <li role="none">
                <Link
                  role="menuitem"
                  href="/wishlist"
                  className={isActive("/wishlist") ? "active" : ""}
                  onClick={() => setIsOpen(false)}
                >
                  Wishlist {isClient && favCount > 0 && <span className="badge" id="fav-count">{favCount}</span>}
                </Link>
              </li>
          )}
          {(headerSettings?.showCart ?? true) && (
              <li role="none">
                <Link
                  role="menuitem"
                  href="/cart"
                  className={isActive("/cart") ? "active" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    openCart();
                    setIsOpen(false);
                  }}
                >
                  Cart {isClient && cartCount > 0 && <span className="badge" id="cart-count">{cartCount}</span>}
                </Link>
              </li>
          )}
          <li role="none">
            <Link
              role="menuitem"
              href="/about"
              className={isActive("/about") ? "active" : ""}
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>
          </li>
          <li role="none">
            <Link
              role="menuitem"
              href="/help"
              className={isActive("/help") ? "active" : ""}
              onClick={() => setIsOpen(false)}
            >
              Help
            </Link>
          </li>

          {/* Auth Section */}
          {isClient && (headerSettings?.showAccount ?? true) && (
            <li role="none" className="nav-auth">
              {user ? (
                <div className="user-menu-wrapper">
                  <button 
                    className="user-menu-trigger"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-expanded={showUserMenu}
                  >
                    <span className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                    <span className="user-name">{user.name || 'My Account'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  
                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-header">
                        <p className="user-dropdown-name">{user.name || 'User'}</p>
                        <p className="user-dropdown-email">{user.email}</p>
                      </div>
                      <div className="user-dropdown-divider" />
                      <Link 
                        href="/account" 
                        className="user-dropdown-item"
                        onClick={() => { setShowUserMenu(false); setIsOpen(false); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        My Account
                      </Link>
                      <Link 
                        href="/account/orders" 
                        className="user-dropdown-item"
                        onClick={() => { setShowUserMenu(false); setIsOpen(false); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18"/>
                          <path d="M9 21V9"/>
                        </svg>
                        My Orders
                      </Link>
                      <div className="user-dropdown-divider" />
                      <button 
                        className="user-dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link 
                    href="/login" 
                    className="btn-login"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </li>
          )}
        </ul>
      </nav>

      <style jsx>{`
        .nav-auth {
          margin-right: auto;
          margin-left: 16px;
        }

        .user-menu-wrapper {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 24px;
          transition: background 0.2s;
        }

        .user-menu-trigger:hover {
          background: rgba(26, 60, 52, 0.08);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a3c34, #2d5a4e);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          min-width: 220px;
          z-index: 1000;
          overflow: hidden;
          animation: dropdownFade 0.2s ease;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .user-dropdown-header {
          padding: 16px;
          background: #f9f9f9;
        }

        .user-dropdown-name {
          font-weight: 600;
          margin: 0;
          color: #1a3c34;
        }

        .user-dropdown-email {
          font-size: 12px;
          color: #888;
          margin: 4px 0 0;
        }

        .user-dropdown-divider {
          height: 1px;
          background: #eee;
        }

        .user-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-main);
          text-decoration: none;
          font-size: 14px;
          transition: background 0.2s;
          width: 100%;
          border: none;
          background: none;
          cursor: pointer;
          text-align: right;
        }

        .user-dropdown-item:hover {
          background: #f5f5f5;
        }

        .user-dropdown-item.logout {
          color: #dc2626;
        }

        .auth-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-login {
          padding: 8px 20px;
          background: #1a3c34;
          color: #fff;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-login:hover {
          background: #142f29;
          transform: translateY(-1px);
        }

          .btn-login {
            width: 100%;
            text-align: center;
          }
        }

        /* Dropdown Styles */
        .nav-item-dropdown {
            position: relative;
            display: flex;
            align-items: center;
            height: 100%;
        }

        .nav-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: #fff;
            min-width: 200px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 12px;
            padding: 8px 0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
            z-index: 100;
            border: 1px solid rgba(0,0,0,0.05);
            /* Fix alignment */
            margin-top: 10px; 
        }

        .nav-dropdown-menu.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .dropdown-item {
            display: block;
            padding: 10px 20px;
            color: #1a3c34;
            text-decoration: none;
            font-size: 14px;
            transition: background 0.1s;
        }

        .dropdown-item:hover {
            background: #f5f5f5;
            color: #d4af37;
        }

        .dropdown-divider {
            height: 1px;
            background: #eee;
            margin: 4px 0;
        }

        @media (max-width: 768px) {
            .nav-item-dropdown {
                flex-direction: column;
                align-items: flex-start;
                height: auto;
                width: 100%;
            }
            
            .nav-dropdown-menu {
                position: static;
                box-shadow: none;
                opacity: 1;
                visibility: visible;
                transform: none;
                padding-left: 16px;
                border: none;
                width: 100%;
                background: transparent;
                display: none;
            }

            .nav-links.open .nav-dropdown-menu {
                display: block;
            }
        }

        .announcement-bar {
            background-color: #1a3c34;
            color: #fff;
            padding: 8px 0;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
        }

        .announcement-bar p {
            margin: 0;
        }
      `}</style>
    </header>
  );
}
