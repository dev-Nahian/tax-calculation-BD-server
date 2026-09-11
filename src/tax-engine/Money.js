/**
 * Money Utility Module for TaxBD
 *
 * Centralizes all monetary arithmetic using integer Taka internally
 * to prevent floating point inaccuracies and standardizes rounding across the engine.
 */

export class Money {
  /**
   * Parse input safely to integer Taka (half-up rounding)
   */
  static from(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    const num = Number(value);
    return Math.round(num);
  }

  static add(...amounts) {
    return amounts.reduce((acc, curr) => acc + Money.from(curr), 0);
  }

  static subtract(a, b) {
    return Money.from(a) - Money.from(b);
  }

  static multiply(amount, factor) {
    return Math.round(Money.from(amount) * Number(factor));
  }

  static divide(amount, divisor) {
    if (divisor === 0) return 0;
    return Math.round(Money.from(amount) / Number(divisor));
  }

  /**
   * Compute percentage safely (e.g. percentage(100000, 5) => 5000)
   */
  static percentage(amount, percent) {
    return Math.round((Money.from(amount) * Number(percent)) / 100);
  }

  static min(...amounts) {
    const valid = amounts.map(Money.from);
    return Math.min(...valid);
  }

  static max(...amounts) {
    const valid = amounts.map(Money.from);
    return Math.max(...valid);
  }

  static clamp(value, minVal, maxVal) {
    return Math.min(Math.max(Money.from(value), Money.from(minVal)), Money.from(maxVal));
  }

  /**
   * Format Taka into standard South Asian numeral system with symbol
   */
  static format(amount, includeSymbol = true) {
    const intVal = Money.from(amount);
    const formatted = intVal.toLocaleString('en-IN');
    return includeSymbol ? `৳ ${formatted}` : formatted;
  }
}

export default Money;
