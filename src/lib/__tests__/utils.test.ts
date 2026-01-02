import { cn, debounce, formatNumber, generateGradient, isValidEthAddress, shortenAddress, throttle } from '@/lib/utils';
import { describe, expect, it } from 'vitest';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    expect(cn('p-4', 'p-2')).toBe('p-2'); // Tailwind merge
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
  });
});

describe('shortenAddress', () => {
  const address = '0x1234567890abcdef1234567890abcdef12345678';

  it('shortens address with default chars', () => {
    expect(shortenAddress(address)).toBe('0x1234...5678');
  });

  it('shortens address with custom chars', () => {
    expect(shortenAddress(address, 6)).toBe('0x123456...345678');
  });

  it('returns empty string for undefined', () => {
    expect(shortenAddress(undefined as any)).toBe('');
  });
});

describe('formatNumber', () => {
  it('formats small numbers', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(999)).toBe('999');
  });

  it('formats thousands', () => {
    expect(formatNumber(1000)).toBe('1K');
    expect(formatNumber(1500)).toBe('1.5K');
    expect(formatNumber(999999)).toBe('1000K');
  });

  it('formats millions', () => {
    expect(formatNumber(1000000)).toBe('1M');
    expect(formatNumber(1500000)).toBe('1.5M');
  });
});

describe('isValidEthAddress', () => {
  it('validates correct addresses', () => {
    expect(isValidEthAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    expect(isValidEthAddress('0xABCDEF1234567890abcdef1234567890ABCDEF12')).toBe(true);
  });

  it('rejects invalid addresses', () => {
    expect(isValidEthAddress('0x123')).toBe(false);
    expect(isValidEthAddress('not-an-address')).toBe(false);
    expect(isValidEthAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false);
    expect(isValidEthAddress('')).toBe(false);
  });
});

describe('generateGradient', () => {
  it('generates consistent gradients for same address', () => {
    const address = '0x1234567890abcdef1234567890abcdef12345678';
    const gradient1 = generateGradient(address);
    const gradient2 = generateGradient(address);
    expect(gradient1).toBe(gradient2);
  });

  it('generates different gradients for different addresses', () => {
    const gradient1 = generateGradient('0x1234567890abcdef1234567890abcdef12345678');
    const gradient2 = generateGradient('0xabcdef1234567890abcdef1234567890abcdef12');
    expect(gradient1).not.toBe(gradient2);
  });
});

describe('debounce', () => {
  it('debounces function calls', async () => {
    let callCount = 0;
    const fn = debounce(() => callCount++, 100);

    fn();
    fn();
    fn();

    expect(callCount).toBe(0);

    await new Promise((r) => setTimeout(r, 150));
    expect(callCount).toBe(1);
  });
});

describe('throttle', () => {
  it('throttles function calls', async () => {
    let callCount = 0;
    const fn = throttle(() => callCount++, 100);

    fn();
    fn();
    fn();

    expect(callCount).toBe(1);

    await new Promise((r) => setTimeout(r, 150));
    fn();
    expect(callCount).toBe(2);
  });
});
