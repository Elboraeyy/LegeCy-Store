'use server';

import prisma from '@/lib/prisma';

export type ApprovalActionType = 'REFUND' | 'PRICE_CHANGE' | 'INVENTORY_ADJUST' | 'CAPITAL_WITHDRAWAL';

/**
 * Approval Service
 * 
 * Manages the lifecycle of sensitive actions requiring multi-person verification.
 */

/**
 * Creates a new approval request.
 * If the user is an owner/super-admin and strict mode is off, it might auto-approve (logic to be added).
 */
export async function requestApproval(
  entityType: string,
  entityId: string,
  actionType: ApprovalActionType,
  data: Record<string, unknown>,
  requestedBy: string,
  ruleId: string // Link to specific rule (e.g. "Refund > 500")
) {
  return await prisma.approvalRequest.create({
    data: {
      entityType,
      entityId,
      actionType,
      actionData: JSON.stringify(data),
      requestedBy,
      status: 'pending',
      ruleId
    }
  });
}

/**
 * Approves a request.
 * If the rule requires 2 approvers, this might just mark the first approval.
 */
export async function approveRequest(requestId: string, approverId: string) {
  const request = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
    include: { rule: true }
  });

  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request is not pending');

  // Check if trying to approve own request (Prevention)
  if (request.requestedBy === approverId) {
    if (!request.rule.autoApprove) { // Only allow if rule explicitly permits self-approval (rare)
        throw new Error('You cannot approve your own request');
    }
  }

  // Check if requires 2 approvers
  if (request.rule.requiresTwo) {
    if (!request.approvedBy) {
      // First approval
      return await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          approvedBy: approverId,
          approvedAt: new Date(),
          // Status remains pending until second approval
        }
      });
    } else {
      // Second approval
      if (request.approvedBy === approverId) {
        throw new Error('You have already approved this request. Waiting for a second different approver.');
      }
      
      return await prisma.approvalRequest.update({
        where: { id: requestId },
        data: {
          secondApprovedBy: approverId,
          secondApprovedAt: new Date(),
          status: 'approved'
        }
      });
    }
  }

  // Single approver flow
  return await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      approvedBy: approverId,
      approvedAt: new Date(),
      status: 'approved'
    }
  });
}

export async function rejectRequest(requestId: string, rejectedBy: string, reason: string) {
  return await prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      rejectedBy,
      rejectedAt: new Date(),
      status: 'rejected',
      rejectReason: reason
    }
  });
}

export async function getPendingApprovals() {
  return await prisma.approvalRequest.findMany({
    where: { status: 'pending' },
    include: {
      rule: true
    },
    orderBy: { requestedAt: 'desc' }
  });
}

/**
 * Check if approval is required for a given action
 * Returns the matching rule if approval is needed, null otherwise
 */
export async function checkApprovalRequired(
  actionType: ApprovalActionType,
  amount: number
): Promise<{ required: boolean; rule?: { id: string; name: string; minAmount: number; requiresTwo: boolean } }> {
  // Find all active rules for this entity type
  const rules = await prisma.approvalRule.findMany({
    where: {
      entityType: actionType.toLowerCase(),
      isActive: true
    },
    orderBy: { priority: 'desc' } // Check highest priority first
  });

  // Find the first rule that matches (parse condition JSON)
  for (const rule of rules) {
    try {
      // condition format: {"field": "amount", "operator": "gt", "value": 500}
      const condition = JSON.parse(rule.condition) as {
        field?: string;
        operator?: string;
        value?: number
      };

      const threshold = condition.value || 0;

      // Check if amount exceeds threshold
      if (condition.operator === 'gt' && amount > threshold) {
        return {
          required: true,
          rule: {
            id: rule.id,
            name: rule.name,
            minAmount: threshold,
            requiresTwo: rule.requiresTwo
          }
        };
      } else if (condition.operator === 'gte' && amount >= threshold) {
        return {
          required: true,
          rule: {
            id: rule.id,
            name: rule.name,
            minAmount: threshold,
            requiresTwo: rule.requiresTwo
          }
        };
      }
    } catch {
      // Skip rules with invalid condition JSON
      continue;
    }
  }

  return { required: false };
}

/**
 * Check if an approval request is fully approved
 */
export async function isApprovalComplete(entityType: string, entityId: string): Promise<boolean> {
  const request = await prisma.approvalRequest.findFirst({
    where: {
      entityType,
      entityId,
      status: 'approved'
    }
  });

  return !!request;
}

/**
 * Get approval status for an entity
 */
export async function getApprovalStatus(entityType: string, entityId: string) {
  const request = await prisma.approvalRequest.findFirst({
    where: {
      entityType,
      entityId
    },
    include: { rule: true },
    orderBy: { requestedAt: 'desc' }
  });

  if (!request) {
    return { status: 'not_required' as const };
  }

  return {
    status: request.status as 'pending' | 'approved' | 'rejected',
    requestId: request.id,
    ruleName: request.rule.name,
    requiresTwo: request.rule.requiresTwo,
    hasFirstApproval: !!request.approvedBy,
    hasSecondApproval: !!request.secondApprovedBy
  };
}
