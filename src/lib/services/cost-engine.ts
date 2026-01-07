import { Decimal } from '@prisma/client/runtime/library';

export class CostEngine {
  /**
   * Calculate Weighted Average Cost
   * New Avg = ((Old Qty * Old Avg) + (New Qty * New Cost)) / (Old Qty + New Qty)
   */
  static calculateWeightedAverage(
    currentStock: number,
    currentAvgCost: Decimal | number,
    incomingQty: number,
    incomingUnitCost: Decimal | number
  ): number {
    const oldVal = Number(currentStock) * Number(currentAvgCost);
    const newVal = Number(incomingQty) * Number(incomingUnitCost);
    const totalQty = Number(currentStock) + Number(incomingQty);

    if (totalQty === 0) return 0;
    
    // Round to 4 decimal places for precision, but currency uses 2
    return Number(((oldVal + newVal) / totalQty).toFixed(4));
  }

  /**
   * Distribute Landed Costs (Shipping, Customs) across items
   * Methods: 'VALUE' (proportional to cost) or 'QUANTITY' (proportional to units)
   */
  static allocateLandedCosts(
    items: { id: string; quantity: number; unitCost: number }[],
    totalLandedCost: number,
    method: 'VALUE' | 'QUANTITY' = 'VALUE'
  ): Record<string, number> {
    const allocation: Record<string, number> = {};
    
    if (items.length === 0) return allocation;
    
    let totalBasis = 0;
    
    // 1. Calculate Basis
    items.forEach(item => {
      if (method === 'VALUE') {
        totalBasis += item.quantity * item.unitCost;
      } else {
        totalBasis += item.quantity;
      }
    });

    // 2. Allocate
    let allocatedSoFar = 0;
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      let share = 0;
      
      if (totalBasis > 0) {
         const itemBasis = method === 'VALUE' ? (item.quantity * item.unitCost) : item.quantity;
         // Calculate raw share
         const rawShare = (itemBasis / totalBasis) * totalLandedCost;
         // Round to 2 decimals usually
         share = Number(rawShare.toFixed(2));
      }
      
      // Handle rounding diff on last item
      if (isLast) {
         share = Number((totalLandedCost - allocatedSoFar).toFixed(2));
      } else {
         allocatedSoFar += share;
      }
      
      // Per unit landed cost addition
      // We return the TOTAL allocated amount for this line item, or per unit? 
      // Usually per line item is safer for DB storage, then divide by qty
      allocation[item.id] = share;
    });

    return allocation;
  }
}
