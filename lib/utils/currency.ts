/**
 * Currency utilities for precise financial calculations
 * Handles rounding, formatting, and distribution of amounts
 */

export class CurrencyUtils {
  private static readonly PRECISION = 2;
  private static readonly MULTIPLIER = Math.pow(10, CurrencyUtils.PRECISION);
  
  /**
   * Format amount with currency symbol
   */
  static format(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: this.PRECISION,
      maximumFractionDigits: this.PRECISION
    }).format(amount);
  }
  
  /**
   * Round amount to currency precision (2 decimal places)
   */
  static round(amount: number): number {
    return Math.round(amount * this.MULTIPLIER) / this.MULTIPLIER;
  }
  
  /**
   * Add multiple amounts with proper rounding
   */
  static add(...amounts: number[]): number {
    const sum = amounts.reduce((acc, val) => acc + val, 0);
    return this.round(sum);
  }
  
  /**
   * Subtract amount with proper rounding
   */
  static subtract(a: number, b: number): number {
    return this.round(a - b);
  }
  
  /**
   * Multiply with proper rounding
   */
  static multiply(a: number, b: number): number {
    return this.round(a * b);
  }
  
  /**
   * Divide with proper rounding
   */
  static divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    return this.round(a / b);
  }
  
  /**
   * Distribute total amount among shares, handling remainder cents
   * Returns array of amounts that sum exactly to total
   */
  static distribute(total: number, shares: number): number[] {
    if (shares <= 0) throw new Error('Shares must be positive');
    if (total < 0) throw new Error('Total must be non-negative');
    
    const baseAmount = Math.floor(total * this.MULTIPLIER / shares) / this.MULTIPLIER;
    const remainder = this.round(total - (baseAmount * shares));
    
    const distribution = Array(shares).fill(baseAmount);
    
    // Distribute remainder cents to first few participants
    let remainderCents = Math.round(remainder * this.MULTIPLIER);
    for (let i = 0; i < remainderCents && i < shares; i++) {
      distribution[i] = this.round(distribution[i] + 0.01);
    }
    
    return distribution;
  }
  
  /**
   * Distribute total amount by percentages
   * Percentages should sum to 100
   */
  static distributeByPercentages(total: number, percentages: number[]): number[] {
    const sum = percentages.reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new Error('Percentages must sum to 100');
    }
    
    const amounts = percentages.map(pct => this.multiply(total, pct / 100));
    
    // Adjust for rounding errors
    const calculatedTotal = amounts.reduce((acc, val) => acc + val, 0);
    const difference = this.round(total - calculatedTotal);
    
    if (Math.abs(difference) > 0.01) {
      // Add difference to largest amount
      const maxIndex = amounts.indexOf(Math.max(...amounts));
      amounts[maxIndex] = this.add(amounts[maxIndex], difference);
    }
    
    return amounts;
  }
  
  /**
   * Distribute total amount by shares (weights)
   */
  static distributeByShares(total: number, shares: number[]): number[] {
    const totalShares = shares.reduce((acc, val) => acc + val, 0);
    if (totalShares === 0) throw new Error('Total shares must be positive');
    
    const amounts = shares.map(share => this.multiply(total, share / totalShares));
    
    // Adjust for rounding errors
    const calculatedTotal = amounts.reduce((acc, val) => acc + val, 0);
    const difference = this.round(total - calculatedTotal);
    
    if (Math.abs(difference) > 0.01) {
      // Add difference to largest amount
      const maxIndex = amounts.indexOf(Math.max(...amounts));
      amounts[maxIndex] = this.add(amounts[maxIndex], difference);
    }
    
    return amounts;
  }
  
  /**
   * Check if two amounts are equal within precision tolerance
   */
  static isEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.01;
  }
  
  /**
   * Check if amount is zero within precision tolerance
   */
  static isZero(amount: number): boolean {
    return Math.abs(amount) < 0.01;
  }
  
  /**
   * Validate currency amount
   */
  static isValidAmount(amount: number): boolean {
    return typeof amount === 'number' && 
           isFinite(amount) && 
           amount >= 0 && 
           amount <= Number.MAX_SAFE_INTEGER;
  }
}

// Export convenience function for backward compatibility
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return CurrencyUtils.format(amount, currency);
};