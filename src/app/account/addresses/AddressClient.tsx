"use client";

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { addAddress, deleteAddress, updateContactInfo } from '@/lib/actions/user';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Addresses.module.css';
import { EGYPT_LOCATIONS } from '@/data/egypt-locations';
import CustomSelect from '@/components/ui/CustomSelect';

interface Address {
    id: string;
    type: string;
    name: string;
    street: string;
    city: string;
    phone: string;
    isDefault: boolean; 
}

interface UserDetails {
    name: string | null;
    email: string;
    phone: string | null;
}

interface AddressClientProps {
    initialAddresses: Address[];
    userDetails: UserDetails | null;
}

export default function AddressClient({ initialAddresses, userDetails }: AddressClientProps) {
    const { t, language } = useLanguage();
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);

    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Contact Info State
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactData, setContactData] = useState({
        name: userDetails?.name || '',
        phone: userDetails?.phone || '',
    });

    // New Address State
    const [newAddress, setNewAddress] = useState({
        type: 'Home',
        name: userDetails?.name || '',
        phone: userDetails?.phone || '',
        governorate: '',
        city: '',
        street: '',
        isDefault: false
    });

    // Get cities based on selected governorate
    const availableCities = useMemo(() => {
        if (!newAddress.governorate) return [];
        const gov = EGYPT_LOCATIONS.find(g => g.en === newAddress.governorate || g.ar === newAddress.governorate);
        return gov ? gov.cities : [];
    }, [newAddress.governorate]);

    // Prepare options for CustomSelect
    const governorateOptions = useMemo(() => {
        return EGYPT_LOCATIONS.map(g => ({
            value: language === 'ar' ? g.ar : g.en,
            label: language === 'ar' ? g.ar : g.en
        }));
    }, [language]);

    const cityOptions = useMemo(() => {
        return availableCities.map(c => ({
            value: language === 'ar' ? c.ar : c.en,
            label: language === 'ar' ? c.ar : c.en
        }));
    }, [availableCities, language]);

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Combine City and Governorate for storage to match schema/checkout behavior
            // Stored as: "City, Governorate"
            const fullCityString = `${newAddress.city}, ${newAddress.governorate}`;

            const res = await addAddress({
                type: newAddress.type,
                name: newAddress.name,
                phone: newAddress.phone,
                street: newAddress.street,
                city: fullCityString,
                isDefault: newAddress.isDefault
            });

            if (res.success) {
                toast.success(t.account.addresses_page.added_success);
                setShowAddModal(false);
                window.location.reload(); 
            } else {
                toast.error(res.error || t.account.addresses_page.failed_add);
            }
        } catch (error) {
            toast.error(t.common.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm(t.account.addresses_page.confirm_delete)) return;
        
        try {
            await deleteAddress(id);
            setAddresses(addresses.filter(addr => addr.id !== id));
            toast.success(t.account.addresses_page.deleted_success);
        } catch (error) {
            toast.error(t.account.addresses_page.failed_delete);
        }
    };

    const handleUpdateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await updateContactInfo(contactData);
            if (res.success) {
                toast.success(t.account.profile_updated);
                setShowContactModal(false);
                window.location.reload();
            } else {
                toast.error(res.error || t.account.update_failed);
            }
        } catch (e) {
            toast.error(t.common.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper} dir={language === 'ar' ? 'rtl' : 'ltr'}>

            {/* Hero Section */}
            <div className={styles.pageHero}>
                <h1 className={styles.heroTitle}>{t.account.addresses_page.title}</h1>
                <p className={styles.heroSubtitle}>{t.account.addresses_desc}</p>
            </div>

            <div className={styles.container}>
                {/* Contact Information Card */}
                <div className={styles.infoCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <div className={styles.cardIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            {t.account.addresses_page.contact_info}
                        </h2>
                        <button className={styles.editBtn} onClick={() => setShowContactModal(true)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            {t.common.edit}
                        </button>
                    </div>

                    <div className={styles.contactGrid}>
                        <div className={styles.contactItem}>
                            <span className={styles.contactLabel}>{t.account.full_name}</span>
                            <span className={styles.contactValue}>{userDetails?.name || '-'}</span>
                        </div>
                        <div className={styles.contactItem}>
                            <span className={styles.contactLabel}>{t.auth.email}</span>
                            <span className={styles.contactValue}>{userDetails?.email || '-'}</span>
                        </div>
                        <div className={styles.contactItem}>
                            <span className={styles.contactLabel}>{t.account.phone_number}</span>
                            <span className={styles.contactValue}>{userDetails?.phone || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Saved Addresses Section */}
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t.account.saved_addresses}</h2>
                    <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        {t.account.addresses_page.add_new}
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <p className={styles.emptyText}>{t.account.addresses_page.no_addresses}</p>
                        <button className={styles.addBtn} onClick={() => setShowAddModal(true)} style={{ margin: '0 auto' }}>
                            {t.account.addresses_page.add_new}
                        </button>
                    </div>
                ) : (
                    <div className={styles.addressList}>
                        {addresses.map((address) => (
                            <div key={address.id} className={`${styles.addressCard} ${address.isDefault ? styles.default : ''}`}>
                                <div className={styles.addressContent}>
                                    <div className={styles.addressTypeBadge}>
                                        {address.type}
                                        {address.isDefault && (
                                            <span className={styles.defaultBadge}>{t.account.addresses_page.default}</span>
                                        )}
                                    </div>
                                    <h3 className={styles.addressName}>{address.name}</h3>
                                    <p className={styles.addressText}>{address.street}</p>
                                    <p className={styles.addressText}>{address.city}</p>
                                    <p className={styles.addressText} style={{ marginTop: '8px' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        {address.phone}
                                    </p>
                                </div>
                                <div className={styles.addressActions}>
                                    <button 
                                        className={`${styles.actionBtn} ${styles.delete}`}
                                        onClick={() => handleDeleteAddress(address.id)}
                                        title={t.account.addresses_page.delete}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className={styles.modalOverlay} onClick={() => setShowContactModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{t.account.edit_profile}</h3>
                            <button className={styles.modalClose} onClick={() => setShowContactModal(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateContact}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t.account.full_name}</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={contactData.name}
                                    onChange={e => setContactData({ ...contactData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t.account.phone_number}</label>
                                <input
                                    type="tel"
                                    className={styles.formInput}
                                    value={contactData.phone}
                                    onChange={e => setContactData({ ...contactData, phone: e.target.value })}
                                    required
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowContactModal(false)}>
                                    {t.common.cancel}
                                </button>
                                <button type="submit" className={styles.btnSave} disabled={isLoading}>
                                    {isLoading ? t.account.addresses_page.saving : t.common.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Address Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>{t.account.addresses_page.add_new}</h3>
                            <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddAddress}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{language === 'ar' ? 'نوع العنوان (منزل، عمل، آخر)' : 'Address Label (Home, Work, etc.)'}</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['Home', 'Work', 'Other'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            className={styles.formInput}
                                            style={{
                                                width: 'auto',
                                                flex: 1,
                                                background: newAddress.type === type ? '#12403C' : '#fff',
                                                color: newAddress.type === type ? '#fff' : 'inherit',
                                                borderColor: newAddress.type === type ? '#12403C' : 'rgba(0,0,0,0.1)'
                                            }}
                                            onClick={() => setNewAddress({ ...newAddress, type })}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t.account.addresses_page.placeholders.contact}</label>
                                    <input
                                        type="text"
                                        required
                                        className={styles.formInput}
                                        value={newAddress.name}
                                        onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{t.account.addresses_page.placeholders.phone}</label>
                                    <input
                                        type="tel"
                                        required
                                        className={styles.formInput}
                                        value={newAddress.phone}
                                        onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{language === 'ar' ? "المحافظة" : "Governorate"}</label>
                                    <CustomSelect
                                        options={governorateOptions}
                                        value={newAddress.governorate}
                                        onChange={(val) => {
                                            setNewAddress({
                                                ...newAddress,
                                                governorate: val,
                                                city: '' // Reset city
                                            })
                                        }}
                                        placeholder={language === 'ar' ? "اختر المحافظة" : "Select Governorate"}
                                        searchPlaceholder={language === 'ar' ? "بحث..." : "Search..."}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>{language === 'ar' ? "المدينة/المركز" : "City/Area"}</label>
                                    <CustomSelect
                                        options={cityOptions}
                                        value={newAddress.city}
                                        onChange={(val) => setNewAddress({ ...newAddress, city: val })}
                                        placeholder={language === 'ar' ? "اختر المدينة" : "Select City"}
                                        searchPlaceholder={language === 'ar' ? "بحث..." : "Search..."}
                                        disabled={!newAddress.governorate}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>{t.account.addresses_page.placeholders.street}</label>
                                <input
                                    type="text"
                                    required
                                    className={styles.formInput}
                                    value={newAddress.street}
                                    onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                    placeholder={language === 'ar' ? "مثال: ٥ شارع الحرية، الدور الثالث، شقة ١٢" : "E.g. 5 Liberty St, 3rd Floor, Apt 12"}
                                />
                            </div>

                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    className={styles.checkbox}
                                    checked={newAddress.isDefault}
                                    onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                />
                                <label htmlFor="isDefault" className={styles.checkboxLabel}>{t.account.addresses_page.set_default}</label>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowAddModal(false)}>
                                    {t.common.cancel}
                                </button>
                                <button type="submit" className={styles.btnSave} disabled={isLoading}>
                                    {isLoading ? t.account.addresses_page.saving : t.account.addresses_page.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
