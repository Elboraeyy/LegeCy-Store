

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateOrderRequest(items: unknown): ValidationResult {
  // 1. Check if items exists and is an array
  if (!items || !Array.isArray(items)) {
    return { isValid: false, error: 'Items must be an array.' };
  }

  // 2. Check if array is empty
  if (items.length === 0) {
    return { isValid: false, error: 'Cart is empty.' };
  }

  // 3. Validate each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (typeof item !== 'object' || item === null) {
      return { isValid: false, error: `Item at index ${i} is invalid.` };
    }

    // Check properties safely
    // We cast to Record<string, unknown> to access properties safely
    const rItem = item as Record<string, unknown>;

    if (typeof rItem.productId !== 'string' || !rItem.productId.trim()) {
      return { isValid: false, error: `Item at index ${i} has invalid productId.` };
    }

    if (typeof rItem.name !== 'string' || !rItem.name.trim()) {
      return { isValid: false, error: `Item at index ${i} has invalid name.` };
    }

    if (typeof rItem.price !== 'number' || rItem.price < 0) {
      return { isValid: false, error: `Item at index ${i} has invalid price.` };
    }

    if (typeof rItem.quantity !== 'number' || rItem.quantity <= 0) {
      return { isValid: false, error: `Item at index ${i} has invalid quantity.` };
    }
  }

  return { isValid: true };
}

export function validatePhoneNumber(phone: unknown): ValidationResult {
  if (typeof phone !== 'string' || !phone) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  const phoneRegex = /^01[0125][0-9]{8}$/;
  
  if (!phoneRegex.test(phone)) {
    return { 
      isValid: false, 
      error: 'Invalid Egyptian phone number. Must start with 010, 011, 012, or 015 and be 11 digits.' 
    };
  }

  return { isValid: true };
}
