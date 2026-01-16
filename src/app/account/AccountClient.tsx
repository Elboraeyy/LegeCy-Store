"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfile, updateProfileImage, removeProfileImage } from "@/lib/actions/profile";
import { logoutAction } from "@/lib/actions/auth";
import styles from "./Account.module.css";

interface RecentOrder {
    id: string;
    status: string;
    createdAt: string;
    totalPrice: number;
    itemCount: number;
}

interface Props {
    user: {
        id: string;
        name: string | null;
        email: string;
        phone: string | null;
        image: string | null;
        points: number;
        createdAt: string;
        orderCount: number;
        addressCount: number;
    };
    recentOrders: RecentOrder[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
    confirmed: { label: "Confirmed", color: "#2563eb", bg: "#dbeafe" },
    paid: { label: "Paid", color: "#059669", bg: "#d1fae5" },
    processing: { label: "Processing", color: "#7c3aed", bg: "#ede9fe" },
    shipped: { label: "Shipped", color: "#0891b2", bg: "#cffafe" },
    delivered: { label: "Delivered", color: "#16a34a", bg: "#dcfce7" },
    cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
};

export default function AccountClient({ user: initialUser, recentOrders }: Props) {
    const router = useRouter();
    const [user, setUser] = useState(initialUser);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form state for edit modal
    const [formData, setFormData] = useState({
        name: user.name || "",
        phone: user.phone || ""
    });

    // File input refs
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

    const getInitial = () => {
        if (user.name) return user.name.charAt(0).toUpperCase();
        return user.email.charAt(0).toUpperCase();
    };

    // Handle file selection and upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image (JPEG, PNG, or WebP)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        setShowAvatarMenu(false);
        setIsUploading(true);

        try {
            // Upload to API
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData,
            });

            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.url) {
                throw new Error(uploadData.error || 'Upload failed');
            }

            // Update profile with new image URL
            const res = await updateProfileImage(uploadData.url);
            if (res.success && res.data) {
                setUser((prev) => ({ ...prev, image: res.data!.image }));
                toast.success('Profile photo updated!');
            } else {
                toast.error(res.error || 'Failed to update photo');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload photo');
        } finally {
            setIsUploading(false);
            // Reset input value to allow selecting the same file again
            if (galleryInputRef.current) galleryInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    // Handle avatar removal
    const handleRemoveAvatar = async () => {
        if (!user.image) return;
        setShowAvatarMenu(false);

        setIsUploading(true);
        try {
            const res = await removeProfileImage();
            if (res.success) {
                setUser((prev) => ({ ...prev, image: null }));
                toast.success("Profile photo removed");
            } else {
                toast.error(res.error || "Failed to remove photo");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsUploading(false);
        }
    };

    // Handle profile update
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await updateProfile({
                name: formData.name,
                phone: formData.phone || null,
            });

            if (res.success && res.data) {
                setUser((prev) => ({
                    ...prev,
                    name: res.data!.name,
                    phone: res.data!.phone,
                }));
                setShowEditModal(false);
                toast.success("Profile updated successfully!");
            } else {
                toast.error(res.error || "Failed to update profile");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle logout
    const handleLogout = async () => {
        await logoutAction();
        router.push("/login");
        router.refresh();
    };

    const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    return (
        <main className={styles.accountPage}>
            {/* Hero Section */}
            <div className={styles.accountHero}>
                <h1 className={styles.heroTitle}>My Account</h1>
                <p className={styles.heroSubtitle}>Manage your profile and preferences</p>
            </div>

            <div className={styles.accountContainer}>
                {/* Profile Card */}
                <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                        {/* Avatar with Upload */}
                        <div className={styles.avatarContainer}>
                            <div className={styles.avatar}>
                                {user.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name || "Profile"}
                                        width={100}
                                        height={100}
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    getInitial()
                                )}
                            </div>

                            {/* Avatar Edit Button */}
                            <button
                                type="button"
                                className={styles.avatarEdit}
                                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                                disabled={isUploading}
                                title="Change photo"
                            >
                                {isUploading ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" opacity="0.25" />
                                        <path d="M12 2a10 10 0 0110 10">
                                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                                        </path>
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                )}
                            </button>

                            {/* Avatar Options Menu */}
                            {showAvatarMenu && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className={styles.avatarMenuBackdrop}
                                        onClick={() => setShowAvatarMenu(false)}
                                    />

                                    {/* Menu */}
                                    <div className={styles.avatarMenu}>
                                        {/* Hidden file inputs */}
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            capture="user"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />

                                        {/* Gallery option */}
                                        <button
                                            type="button"
                                            className={styles.avatarMenuItem}
                                            onClick={() => galleryInputRef.current?.click()}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                            Choose from Gallery
                                        </button>

                                        {/* Camera option */}
                                        <button
                                            type="button"
                                            className={styles.avatarMenuItem}
                                            onClick={() => cameraInputRef.current?.click()}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                                <circle cx="12" cy="13" r="4" />
                                            </svg>
                                            Take a Photo
                                        </button>

                                        {user.image && (
                                            <button
                                                type="button"
                                                className={`${styles.avatarMenuItem} ${styles.avatarMenuItemDanger}`}
                                                onClick={handleRemoveAvatar}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Info */}
                        <div className={styles.profileInfo}>
                            <h2 className={styles.userName}>
                                {user.name || "User"}
                                <span className={styles.verifiedBadge}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </span>
                            </h2>
                            <p className={styles.userEmail}>{user.email}</p>
                            <p className={styles.memberSince}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Member since {memberSince}
                            </p>
                        </div>

                        {/* Edit Button */}
                        <button
                            className={styles.editProfileBtn}
                            onClick={() => {
                                setFormData({ name: user.name || "", phone: user.phone || "" });
                                setShowEditModal(true);
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Profile
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{user.orderCount}</span>
                            <span className={styles.statLabel}>Orders</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{user.points}</span>
                            <span className={styles.statLabel}>Points</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{user.addressCount}</span>
                            <span className={styles.statLabel}>Addresses</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>⭐</span>
                            <span className={styles.statLabel}>VIP</span>
                        </div>
                    </div>
                </div>

                {/* Loyalty Card */}
                <div className={styles.loyaltyCard}>
                    <div className={styles.loyaltyInfo}>
                        <h3>Loyalty Points</h3>
                        <p className={styles.loyaltyPoints}>{user.points.toLocaleString()}</p>
                    </div>
                    <div className={styles.loyaltyMeta}>
                        <p>Every 10 EGP = 1 Point</p>
                        <p>Redeem on your next order</p>
                    </div>
                </div>

                {/* Recent Orders */}
                {recentOrders.length > 0 && (
                    <>
                        <div className={styles.sectionTitle}>
                            <span>Recent Orders</span>
                            <Link href="/account/orders" className={styles.viewAllLink}>
                                View All →
                            </Link>
                        </div>
                        <div className={styles.recentOrders}>
                            {recentOrders.map((order) => {
                                const status = statusConfig[order.status] || statusConfig.pending;
                                return (
                                    <Link key={order.id} href={`/track/${order.id}`} className={styles.orderCard}>
                                        <div className={styles.orderIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                                <line x1="12" y1="22.08" x2="12" y2="12" />
                                            </svg>
                                        </div>
                                        <div className={styles.orderInfo}>
                                            <p className={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</p>
                                            <p className={styles.orderDate}>{formatDate(order.createdAt)} • {order.itemCount} item{order.itemCount > 1 ? "s" : ""}</p>
                                        </div>
                                        <span
                                            className={styles.orderStatus}
                                            style={{ color: status.color, background: status.bg }}
                                        >
                                            {status.label}
                                        </span>
                                        <span className={styles.orderPrice}>{formatPrice(order.totalPrice)}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Quick Links */}
                <div className={styles.sectionTitle} style={{ marginTop: recentOrders.length > 0 ? "24px" : "0" }}>
                    <span>Quick Actions</span>
                </div>
                <div className={styles.quickLinks}>
                    <Link href="/account/orders" className={styles.quickLink}>
                        <div className={styles.quickLinkIcon}>📦</div>
                        <div className={styles.quickLinkContent}>
                            <p className={styles.quickLinkTitle}>My Orders</p>
                            <p className={styles.quickLinkDesc}>View and track all your orders</p>
                        </div>
                        <svg className={styles.quickLinkArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>

                    <Link href="/account/addresses" className={styles.quickLink}>
                        <div className={styles.quickLinkIcon}>🏠</div>
                        <div className={styles.quickLinkContent}>
                            <p className={styles.quickLinkTitle}>Saved Addresses</p>
                            <p className={styles.quickLinkDesc}>Manage your shipping addresses</p>
                        </div>
                        <svg className={styles.quickLinkArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>

                    <Link href="/wishlist" className={styles.quickLink}>
                        <div className={styles.quickLinkIcon}>❤️</div>
                        <div className={styles.quickLinkContent}>
                            <p className={styles.quickLinkTitle}>Wishlist</p>
                            <p className={styles.quickLinkDesc}>Your saved products</p>
                        </div>
                        <svg className={styles.quickLinkArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>

                    <Link href="/account/change-password" className={styles.quickLink}>
                        <div className={styles.quickLinkIcon}>🔒</div>
                        <div className={styles.quickLinkContent}>
                            <p className={styles.quickLinkTitle}>Change Password</p>
                            <p className={styles.quickLinkDesc}>Update your account password</p>
                        </div>
                        <svg className={styles.quickLinkArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>

                    <Link href="/contact" className={styles.quickLink}>
                        <div className={styles.quickLinkIcon}>💬</div>
                        <div className={styles.quickLinkContent}>
                            <p className={styles.quickLinkTitle}>Support</p>
                            <p className={styles.quickLinkDesc}>Contact us for help</p>
                        </div>
                        <svg className={styles.quickLinkArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </Link>
                </div>

                {/* Logout Button */}
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                </button>


            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Edit Profile</h3>
                            <button className={styles.modalClose} onClick={() => setShowEditModal(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={styles.formInput}
                                    placeholder="Enter your name"
                                    required
                                    minLength={2}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={styles.formInput}
                                    placeholder="01XXXXXXXXX"
                                />
                                <p className={styles.formHint}>Egyptian mobile number (optional)</p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email Address</label>
                                <input
                                    type="email"
                                    value={user.email}
                                    className={styles.formInput}
                                    disabled
                                />
                                <p className={styles.formHint}>Email cannot be changed</p>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.btnSave} disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
