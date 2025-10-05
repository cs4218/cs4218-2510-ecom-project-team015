// These test cases have been written with the help of Claude.
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './cart';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    getStore: () => store, 
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CartProvider', () => {
  beforeEach(() => {
    // Clear the internal store first
    localStorageMock.clear();
    
    // Then clear all mock function call histories
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Ensure getItem returns null by default (no cart in storage)
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should initialize cart as empty array when localStorage is empty', () => {
      
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current[0]).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cart');
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1);
    });

    it('should load cart from localStorage when data exists', async () => {
      const mockCartData = [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCartData));

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(mockCartData);
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('cart');
    });

    it('should handle empty array in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual([]);
      });
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json{');

      expect(() => {
        renderHook(() => useCart(), {
          wrapper: CartProvider,
        });
      }).toThrow();
    });
  });

  describe('Cart State Management', () => {
    it('should update cart state when setCart is called', () => {

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });
      const newCartItem = { id: 1, name: 'New Product', price: 50 };

      act(() => {
        result.current[1]([newCartItem]);
      });

      expect(result.current[0]).toEqual([newCartItem]);
    });

    it('should update cart with multiple items', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });
      const multipleItems = [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 },
        { id: 3, name: 'Product 3', price: 300 },
      ];

      act(() => {
        result.current[1](multipleItems);
      });

      expect(result.current[0]).toEqual(multipleItems);
      expect(result.current[0]).toHaveLength(3);
    });

    it('should clear cart when setCart is called with empty array', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });
      const initialCart = [{ id: 1, name: 'Product 1', price: 100 }];
      
      act(() => {
        result.current[1](initialCart);
      });

      act(() => {
        result.current[1]([]);
      });

      expect(result.current[0]).toEqual([]);
    });

    it('should handle adding items to existing cart', async () => {
      const existingCart = [{ id: 1, name: 'Product 1', price: 100 }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingCart));
      
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        expect(result.current[0]).toEqual(existingCart);
      });

      act(() => {
        const updatedCart = [
          ...result.current[0],
          { id: 2, name: 'Product 2', price: 200 },
        ];
        result.current[1](updatedCart);
      });

      expect(result.current[0]).toHaveLength(2);
      expect(result.current[0][1]).toEqual({ id: 2, name: 'Product 2', price: 200 });
    });
  });

  describe('useCart Hook', () => {
    it('should return undefined when used outside CartProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCart());

      expect(result.current).toBeUndefined();

      consoleError.mockRestore();
    });

    it('should return cart and setCart function when used inside provider', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current).toHaveLength(2);
      expect(Array.isArray(result.current[0])).toBe(true);
      expect(typeof result.current[1]).toBe('function');
    });
  });

  describe('Boundary Case', () => {
    it('should handle cart with large number of items', async () => {
      const largeCart = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: (i + 1) * 10,
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeCart));

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        expect(result.current[0]).toHaveLength(100);
      });
    });
  });
});