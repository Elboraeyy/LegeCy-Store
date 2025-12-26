import { validateOrderTransition } from '@/lib/policies/orderPolicy';
import { OrderStatus } from '@/lib/orderStatus';
import { OrderError, ForbiddenError, InventoryError } from '@/lib/errors';
import { INVENTORY_POLICIES } from '@/lib/policies/inventoryPolicy';

async function main() {
    console.log("🔒 Starting Domain Policy Verification...\n");

    let errors = 0;

    // ==========================================
    // 1. Order Policy Tests (Pure Logic)
    // ==========================================
    console.log("👉 Testing Order Policies...");

    // Test 1: Pending -> Paid by System (Should PASS)
    try {
        validateOrderTransition(OrderStatus.Pending, OrderStatus.Paid, 'system');
        console.log("✅ Pending -> Paid (System): Allowed");
    } catch (e) {
        console.error("❌ Pending -> Paid (System): Failed incorrectly", e);
        errors++;
    }

    // Test 2: Pending -> Paid by Admin (Should FAIL)
    try {
        validateOrderTransition(OrderStatus.Pending, OrderStatus.Paid, 'admin');
        console.error("❌ Pending -> Paid (Admin): Allowed incorrectly! (SECURITY RISK)");
        errors++;
    } catch (e) {
        if (e instanceof ForbiddenError || e instanceof OrderError) {
            console.log("✅ Pending -> Paid (Admin): Blocked correctly");
        } else {
            console.error("❌ Pending -> Paid (Admin): Failed with unexpected error", e);
            errors++;
        }
    }

    // Test 3: Pending -> Delivered (Impossible Transition) (Should FAIL)
    try {
        validateOrderTransition(OrderStatus.Pending, OrderStatus.Delivered, 'admin');
        console.error("❌ Pending -> Delivered: Allowed incorrectly!");
        errors++;
    } catch (e) {
        if (e instanceof OrderError) {
            console.log("✅ Pending -> Delivered: Blocked correctly");
        } else {
            console.error("❌ Pending -> Delivered: Failed with unexpected error", e);
            errors++;
        }
    }

    // ==========================================
    // 2. Inventory Invariant Tests (Mocked DB)
    // ==========================================
    console.log("\n👉 Testing Inventory Invariants...");

    // Test 4: Commit Stock for Pending Order (Should FAIL)
    try {
        INVENTORY_POLICIES.requirePaymentForCommit(OrderStatus.Pending);
        console.error("❌ Commit Stock (Pending): Allowed incorrectly!");
        errors++;
    } catch (e) {
        if (e instanceof InventoryError) {
             console.log("✅ Commit Stock (Pending): Blocked correctly");
        } else {
             console.error("❌ Commit Stock (Pending): Failed with unexpected error", e);
             errors++;
        }
    }

    // Test 5: Commit Stock for Paid Order (Should PASS)
     try {
        INVENTORY_POLICIES.requirePaymentForCommit(OrderStatus.Paid);
        console.log("✅ Commit Stock (Paid): Allowed");
    } catch (e) {
        console.error("❌ Commit Stock (Paid): Failed incorrectly", e);
        errors++;
    }
    
    // Test 6: Commit Stock for Shipped Order (Should PASS)
    try {
        INVENTORY_POLICIES.requirePaymentForCommit(OrderStatus.Shipped);
        console.log("✅ Commit Stock (Shipped): Allowed");
    } catch (e) {
        console.error("❌ Commit Stock (Shipped): Failed incorrectly", e);
        errors++;
    }

    // Test 7: Negative Stock Check
    try {
        INVENTORY_POLICIES.ensurePositiveStock(5, -6); // 5 - 6 = -1
        console.error("❌ Negative Stock: Allowed incorrectly!");
        errors++;
    } catch (e) {
        if (e instanceof InventoryError) {
            console.log("✅ Negative Stock: Blocked correctly");
        } else {
            console.error("❌ Negative Stock: Failed with unexpected error", e);
            errors++;
        }
    }


    if (errors === 0) {
        console.log("\n✨ ALL POLICIES VERIFIED SUCCESSFULLY ✨");
        process.exit(0);
    } else {
        console.error(`\n❌ Validation Failed with ${errors} errors.`);
        process.exit(1);
    }
}

main();
