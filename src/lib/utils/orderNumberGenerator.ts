/**
 * Generates the next sequential order number based on the last one.
 * Sequence:
 * - A001 to A999 (3 digits, zero-padded)
 * - Next is B001 to B999, ..., Z999
 * - Next is A1000 to A9999 (4 digits)
 * - Next is B1000 to B9999, ..., Z9999
 * - Next is A10000 to A99999 (5 digits) etc.
 */
export function generateNextOrderNumber(lastOrderNumber: string | null): string {
  if (!lastOrderNumber) {
    return 'A001';
  }

  const match = lastOrderNumber.match(/^([A-Z])(\d+)$/);
  if (!match) {
    return 'A001'; // Fallback
  }

  const letter = match[1];
  const numStr = match[2];
  const num = parseInt(numStr, 10);
  const digitsCount = numStr.length;

  // Determine max number for this digit count
  // E.g., for 3 digits max is 999, for 4 digits max is 9999
  const maxNum = Math.pow(10, digitsCount) - 1;

  if (num < maxNum) {
    const nextNum = num + 1;
    const paddedNum = String(nextNum).padStart(digitsCount, '0');
    return `${letter}${paddedNum}`;
  } else {
    // Reached maxNum (e.g. 999 or 9999)
    if (letter !== 'Z') {
      const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
      // For 3 digits, we reset to 1 (zero-padded). For more digits, we reset to 10^(digits-1) (e.g. 1000 for 4 digits)
      const startNum = digitsCount === 3 ? 1 : Math.pow(10, digitsCount - 1);
      const paddedNum = String(startNum).padStart(digitsCount, '0');
      return `${nextLetter}${paddedNum}`;
    } else {
      // Reached 'Z' (e.g. Z999 or Z9999)
      // Increase digit count by 1 and reset letter to 'A'
      const nextDigitsCount = digitsCount + 1;
      const startNum = Math.pow(10, nextDigitsCount - 1);
      return `A${startNum}`;
    }
  }
}
