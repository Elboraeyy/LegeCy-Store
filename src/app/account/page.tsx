import { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateCustomerSession } from "@/lib/auth/session";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Account | Legacy Store",
  description: "Manage your account and view your orders",
};

export default async function AccountPage() {
  const { user } = await validateCustomerSession();

  if (!user) {
    redirect('/login?redirect=/account');
  }

  return (
    <main>
      <section className="shop-hero">
        <div className="container">
          <h1 className="fade-in">My Account</h1>
          <p className="fade-in">Welcome{user.name ? `, ${user.name}` : ''}!</p>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          
          {/* User Info Card */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "24px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "20px",
              marginBottom: "24px"
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1a3c34, #2d5a4e)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                fontWeight: 600
              }}>
                {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: "24px" }}>{user.name || 'User'}</h2>
                <p style={{ margin: 0, color: "var(--text-muted)" }}>{user.email}</p>
              </div>
            </div>
          </div>

            {/* Loyalty Points Card */}
            <div style={{
                background: "linear-gradient(135deg, #1a3c34, #2d5a4e)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(26,60,52,0.2)"
            }}>
                <div>
                   <h3 style={{ margin: "0 0 4px", fontSize: "16px", opacity: 0.9 }}>Loyalty Points</h3>
                   <p style={{ margin: 0, fontSize: "32px", fontWeight: "700" }}>{user.points || 0}</p>
                </div>
                <div style={{ textAlign: "right", opacity: 0.9, fontSize: "13px" }}>
                   <p style={{ margin: 0 }}>Every 10 EGP = 1 Point</p>
                </div>
            </div>

           {/* Quick Links */}
           <div style={{ display: "grid", gap: "16px" }}>
             <Link href="/account/orders" style={{
               display: "flex",
               alignItems: "center",
               gap: "16px",
               background: "#fff",
               borderRadius: "12px",
               padding: "20px 24px",
               textDecoration: "none",
               color: "inherit",
               boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
               transition: "all 0.2s"
             }}>
               <span style={{ fontSize: "24px" }}>📦</span>
               <div style={{ flex: 1 }}>
                 <p style={{ margin: 0, fontWeight: 600 }}>My Orders</p>
                 <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
                   View and track all your orders
                 </p>
               </div>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M9 18l6-6-6-6"/>
               </svg>
             </Link>

             <Link href="/account/addresses" style={{
               display: "flex",
               alignItems: "center",
               gap: "16px",
               background: "#fff",
               borderRadius: "12px",
               padding: "20px 24px",
               textDecoration: "none",
               color: "inherit",
               boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
               transition: "all 0.2s"
             }}>
               <span style={{ fontSize: "24px" }}>🏠</span>
               <div style={{ flex: 1 }}>
                 <p style={{ margin: 0, fontWeight: 600 }}>Saved Addresses</p>
                 <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
                   Manage your shipping addresses
                 </p>
               </div>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M9 18l6-6-6-6"/>
               </svg>
             </Link>

             <Link href="/wishlist" style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "#fff",
              borderRadius: "12px",
              padding: "20px 24px",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: "24px" }}>❤️</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Wishlist</p>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
                  Your saved products
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>

            <Link href="/contact" style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "#fff",
              borderRadius: "12px",
              padding: "20px 24px",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: "24px" }}>💬</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Support</p>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
                  Contact us for help
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>

            <Link href="/account/change-password" style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "#fff",
              borderRadius: "12px",
              padding: "20px 24px",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.2s"
            }}>
              <span style={{ fontSize: "24px" }}>🔒</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Change Password</p>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
                  Update your account password
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
