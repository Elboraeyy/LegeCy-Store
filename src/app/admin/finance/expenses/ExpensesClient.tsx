
'use client';

import { useState, useTransition } from 'react';
import { createExpense, createExpenseCategory } from '@/lib/actions/finance';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  amount: number | string | { toNumber: () => number }; // Prisma Decimal support
  description: string;
  date: string | Date;
  status: string;
  paidBy?: string | null; // Added paidBy which was missing
  category: Category;
}

export default function ExpensesClient({ expenses, categories }: { expenses: Expense[]; categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        let finalCategoryId = categoryId;
        
        // If creating a new category
        if (isNewCategory && newCategoryName) {
            const newCat = await createExpenseCategory(newCategoryName);
            finalCategoryId = newCat.id;
        }

        await createExpense({
            description,
            amount: Number(amount),
            categoryId: finalCategoryId
        });
        
        setShowModal(false);
        setAmount('');
        setDescription('');
        setCategoryId('');
        setIsNewCategory(false);
        setNewCategoryName('');
        router.refresh();
      } catch (error) {
        alert('Error recording expense');
        console.error(error);
      }
    });
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Expense Management</h1>
          <p className="admin-subtitle">Track operational costs and outflows</p>
        </div>
        <button 
            onClick={() => setShowModal(true)} 
            className="admin-btn admin-btn-primary"
        >
            + Record Expense
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Paid By</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map(exp => (
                        <tr key={exp.id}>
                            <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {new Date(exp.date).toLocaleDateString()}
                            </td>
                            <td style={{ fontWeight: 500 }}>{exp.description}</td>
                            <td>
                                <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    background: '#f3f4f6', 
                                    fontSize: '11px',
                                    border: '1px solid var(--admin-border)'
                                }}>
                                    {exp.category?.name}
                                </span>
                            </td>
                            <td style={{ fontSize: '13px' }}>{exp.paidBy || '-'}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '12px', fontSize: '11px',
                                    background: exp.status === 'PAID' ? '#dcfce7' : '#fef9c3',
                                    color: exp.status === 'PAID' ? '#166534' : '#854d0e',
                                    border: '1px solid transparent'
                                }}>
                                    {exp.status}
                                </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#991b1b' }}>
                                -{formatCurrency(Number(exp.amount))}
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No expenses recorded yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
            <div className="admin-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                <h3 className="font-heading" style={{ fontSize: '20px', marginBottom: '8px' }}>Record New Expense</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    This will create a journal entry deducting from Cash on Hand.
                </p>

                <form onSubmit={handleCreateExpense}>
                    
                    <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                        <label>Description</label>
                        <input 
                            type="text" 
                            className="form-input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="e.g. Office Supplies"
                            required
                        />
                    </div>

                    <div className="admin-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div className="admin-form-group">
                            <label>Amount (EGP)</label>
                            <input 
                                type="number" 
                                className="form-input"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                min="1"
                            />
                        </div>

                        {!isNewCategory ? (
                            <div className="admin-form-group">
                                <label>Category</label>
                                <select 
                                    className="form-input" 
                                    value={categoryId}
                                    onChange={e => {
                                        if (e.target.value === 'NEW') setIsNewCategory(true);
                                        else setCategoryId(e.target.value);
                                    }}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                    <option value="NEW">+ Create New Category</option>
                                </select>
                            </div>
                        ) : (
                            <div className="admin-form-group">
                                <label>New Category Name</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        placeholder="e.g. Travel"
                                        autoFocus
                                    />
                                    <button 
                                        type="button" 
                                        className="admin-btn admin-btn-outline"
                                        onClick={() => setIsNewCategory(false)}
                                        style={{ padding: '0 12px' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="admin-btn admin-btn-outline"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="admin-btn admin-btn-primary"
                            disabled={isPending}
                        >
                            {isPending ? 'Processing...' : 'Record Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
