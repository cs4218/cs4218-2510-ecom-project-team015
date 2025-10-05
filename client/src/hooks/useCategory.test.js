// These tests have been written with the help of Claude.
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import useCategory from './useCategory';

jest.mock('axios');

const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

describe('useCategory Hook - Original Version', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Successful API calls', () => {
    
    test('should initialize with empty categories array', async () => {
    
      axios.get.mockResolvedValue({ data: { category: [] } });

      const { result } = renderHook(() => useCategory());

      expect(result.current).toEqual([]);
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
    });

    test('should fetch and set categories on mount', async () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
      });
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith('/api/v1/category/get-category');
    });

    test('should handle single category response', async () => {
      const mockCategory = [
        { _id: '1', name: 'Books', slug: 'books' }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategory } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toHaveLength(1);
      });
      expect(result.current[0]).toEqual(mockCategory[0]);
    });

    test('should handle empty categories array from API', async () => {
      
      axios.get.mockResolvedValue({ 
        data: { category: [] } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
      expect(result.current).toEqual([]);
    });

    test('should handle large number of categories', async () => {
      // Arrange - Boundary test with 100 categories
      const mockCategories = Array.from({ length: 100 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`
      }));
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });

      // Act
      const { result } = renderHook(() => useCategory());

      // Assert
      await waitFor(() => {
        expect(result.current).toHaveLength(100);
      });
      expect(result.current[0]._id).toBe('1');
      expect(result.current[99]._id).toBe('100');
    });

  });

  describe('Error handling', () => {

    test('should log error when API call fails with network error', async () => {
    
      const networkError = new Error('Network Error');
      axios.get.mockRejectedValue(networkError);

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(networkError);
      });
      // Categories should remain empty array (initial state)
      expect(result.current).toEqual([]);
    });

    test('should log error when API returns 404', async () => {
      
      const error404 = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        }
      };
      axios.get.mockRejectedValue(error404);

      
      const { result } = renderHook(() => useCategory());

    
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(error404);
      });
      expect(result.current).toEqual([]);
    });

    test('should log error when API returns 500', async () => {

      const error500 = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };
      axios.get.mockRejectedValue(error500);

    
      const { result } = renderHook(() => useCategory());


      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(error500);
      });
      expect(result.current).toEqual([]);
    });

    test('should log error when API returns 401 Unauthorized', async () => {
      const error401 = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      axios.get.mockRejectedValue(error401);

      
      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(error401);
      });
      expect(result.current).toEqual([]);
    });

    test('should handle timeout error', async () => {
    
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };
      axios.get.mockRejectedValue(timeoutError);

    
      const { result } = renderHook(() => useCategory());

    
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(timeoutError);
      });
      expect(result.current).toEqual([]);
    });

  });

  describe('Hook lifecycle', () => {

    test('should call API only once on mount', async () => {
      axios.get.mockResolvedValue({ 
        data: { category: [] } 
      });

      const { rerender } = renderHook(() => useCategory());
      
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      const callCount = axios.get.mock.calls.length;

      rerender();
      rerender();
      rerender();

      // Assert - Should still be the same call count
      expect(axios.get).toHaveBeenCalledTimes(callCount);
    });

    test('should not call API again on rerender', async () => {
      
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });


      const { result, rerender } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
      });

      const callCountAfterMount = axios.get.mock.calls.length;
      
      rerender();

      expect(axios.get).toHaveBeenCalledTimes(callCountAfterMount);
    });

    test('should maintain state across rerenders after successful fetch', async () => {
      
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });


      const { result, rerender } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual(mockCategories);
      });

      const categoriesBeforeRerender = result.current;
      
      rerender();

      
      expect(result.current).toBe(categoriesBeforeRerender);
      expect(result.current).toEqual(mockCategories);
    });

  });

  describe('API response format validation', () => {

    test('should handle categories with all expected fields', async () => {
      const mockCategories = [
        { 
          _id: '1', 
          name: 'Electronics', 
          slug: 'electronics',
          description: 'Electronic items',
          createdAt: '2025-01-01T00:00:00.000Z'
        }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toHaveLength(1);
      });
      expect(result.current[0]).toHaveProperty('_id');
      expect(result.current[0]).toHaveProperty('name');
      expect(result.current[0]).toHaveProperty('slug');
      expect(result.current[0]).toHaveProperty('description');
      expect(result.current[0]).toHaveProperty('createdAt');
    });

  });

  describe('Boundary value testing', () => {

    test('should handle zero categories', async () => {
      axios.get.mockResolvedValue({ 
        data: { category: [] } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
      expect(result.current).toHaveLength(0);
    });

    test('should handle category with empty string name', async () => {
      const mockCategories = [
        { _id: '1', name: '', slug: '' }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });

      
      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toHaveLength(1);
      });
      expect(result.current[0].name).toBe('');
      expect(result.current[0].slug).toBe('');
    });

    test('should handle category with very long name', async () => {
      const longName = 'A'.repeat(1000);
      const mockCategories = [
        { _id: '1', name: longName, slug: 'long-category' }
      ];
      axios.get.mockResolvedValue({ 
        data: { category: mockCategories } 
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toHaveLength(1);
      });
      expect(result.current[0].name).toBe(longName);
      expect(result.current[0].name).toHaveLength(1000);
    });

  });

});