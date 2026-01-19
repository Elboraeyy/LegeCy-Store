import prisma from '@/lib/prisma';
import { inventoryService } from './inventoryService';
import { logger } from '@/lib/logger';

export const stockTransferService = {
  /**
   * Create a Draft Transfer
   */
  async createTransfer(data: { fromWarehouseId: string; toWarehouseId: string; notes?: string; items: { variantId: string; quantity: number }[], createdById: string }) {
      return await prisma.stockTransfer.create({
          data: {
              fromWarehouseId: data.fromWarehouseId,
              toWarehouseId: data.toWarehouseId,
              notes: data.notes,
              createdById: data.createdById,
              status: 'PENDING',
              items: {
                  create: data.items.map(item => ({
                      variantId: item.variantId,
                      requestedQty: item.quantity
                  }))
              }
          }
      });
  },

  /**
   * Approve Transfer (Reserves Stock at Source)
   */
  async approveTransfer(transferId: string, approvedById: string) {
      return await prisma.$transaction(async (tx) => {
          const transfer = await tx.stockTransfer.findUnique({
              where: { id: transferId },
              include: { items: true }
          });

          if (!transfer || transfer.status !== 'PENDING') throw new Error("Invalid transfer status");

          // Reserve Stock
          for (const item of transfer.items) {
              await inventoryService.reserveStock(tx, transfer.fromWarehouseId, item.variantId, item.requestedQty);
          }

          return await tx.stockTransfer.update({
              where: { id: transferId },
              data: {
                  status: 'APPROVED',
                  approvedById,
                  approvedAt: new Date()
              }
          });
      });
  },

  /**
   * Ship Transfer (Deducts Stock from Source)
   */
  async shipTransfer(transferId: string) {
      return await prisma.$transaction(async (tx) => {
          const transfer = await tx.stockTransfer.findUnique({
              where: { id: transferId },
              include: { items: true }
          });

          if (!transfer || transfer.status !== 'APPROVED') throw new Error("Transfer must be APPROVED before shipping");

          // Commit/Deduct Stock from Source
          for (const item of transfer.items) {
              await inventoryService.commitStock(tx, transfer.fromWarehouseId, item.variantId, item.requestedQty);
              
              // Update item sent qty (assuming full shipment for now)
              await tx.stockTransferItem.update({
                  where: { id: item.id },
                  data: { sentQty: item.requestedQty }
              });
          }

          return await tx.stockTransfer.update({
              where: { id: transferId },
              data: {
                  status: 'IN_TRANSIT',
                  shippedAt: new Date()
              }
          });
      });
  },

  /**
   * Receive Transfer (Adds Stock to Dest)
   */
  async receiveTransfer(transferId: string) {
      return await prisma.$transaction(async (tx) => {
          const transfer = await tx.stockTransfer.findUnique({
              where: { id: transferId },
              include: { items: true }
          });

          if (!transfer || transfer.status !== 'IN_TRANSIT') throw new Error("Transfer must be IN_TRANSIT to receive");

          // Add Stock to Destination
          for (const item of transfer.items) {
              // Assume we receive what was sent (no partials for MVP)
              const qtyToReceive = item.sentQty || item.requestedQty;
              
              await inventoryService.increaseStock(tx, transfer.toWarehouseId, item.variantId, qtyToReceive);

              await tx.stockTransferItem.update({
                  where: { id: item.id },
                  data: { receivedQty: qtyToReceive }
              });
          }

          return await tx.stockTransfer.update({
              where: { id: transferId },
              data: {
                  status: 'RECEIVED',
                  receivedAt: new Date()
              }
          });
      });
  },
  
  async getTransfers() {
      return await prisma.stockTransfer.findMany({
          orderBy: { createdAt: 'desc' },
          include: { fromWarehouse: true, toWarehouse: true, items: true }
      });
  }
};
