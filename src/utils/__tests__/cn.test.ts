import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('should merge multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('should handle Tailwind class conflicts (later wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-gray-100', 'bg-white')).toBe('bg-white');
  });

  it('should preserve non-conflicting classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    expect(cn('text-sm font-bold', 'text-lg')).toBe('font-bold text-lg');
  });

  it('should handle conditional classes (truthy values)', () => {
    expect(cn('base', true && 'truthy')).toBe('base truthy');
    expect(cn('base', false && 'falsy')).toBe('base');
    expect(cn('base', null && 'null-class')).toBe('base');
    expect(cn('base', undefined && 'undefined-class')).toBe('base');
  });

  it('should handle object inputs', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ 'text-red-500': true, 'bg-blue-500': false })).toBe('text-red-500');
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('should handle array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['px-2', 'py-1'], 'px-4')).toBe('py-1 px-4');
    expect(cn([['nested', 'array']])).toBe('nested array');
  });

  it('should handle null and undefined values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should handle empty strings', () => {
    expect(cn('')).toBe('');
    expect(cn('', 'foo')).toBe('foo');
    expect(cn('foo', '')).toBe('foo');
  });

  it('should handle complex Tailwind variants', () => {
    expect(cn('hover:text-red-500', 'hover:text-blue-500')).toBe('hover:text-blue-500');
    expect(cn('md:px-4', 'lg:px-6')).toBe('md:px-4 lg:px-6');
    expect(cn('dark:bg-gray-800', 'dark:bg-black')).toBe('dark:bg-black');
  });

  it('should handle arbitrary values', () => {
    expect(cn('w-[100px]', 'w-[200px]')).toBe('w-[200px]');
    expect(cn('text-[14px]', 'text-[16px]')).toBe('text-[16px]');
  });

  it('should deduplicate identical classes', () => {
    expect(cn('foo', 'foo')).toBe('foo foo');
    expect(cn('foo bar', 'bar baz')).toBe('foo bar bar baz');
  });

  it('should handle mixed input types', () => {
    expect(cn('base', { active: true }, ['foo', 'bar'], null, 'end')).toBe('base active foo bar end');
  });
});
