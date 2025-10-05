// These test cases have been written with the help of Claude.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Categories from './Categories';
import useCategory from '../hooks/useCategory';

jest.mock('../hooks/useCategory');

jest.mock('../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

describe('Categories Component', () => {
  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render Layout with correct title', () => {
      useCategory.mockReturnValue([]);

      renderWithRouter(<Categories />);
      const layout = screen.getByTestId('layout');

      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute('data-title', 'All Categories');
    });

    test('should render container with correct structure', () => {
      useCategory.mockReturnValue([]);

      const { container } = renderWithRouter(<Categories />);
      const containerDiv = container.querySelector('.container');
      const rowDiv = container.querySelector('.row');

      expect(containerDiv).toBeInTheDocument();
      expect(rowDiv).toBeInTheDocument();
    });
  });

  describe('Categories Display - Empty State', () => {
    test('should render no category links when categories array is empty', () => {
      
      useCategory.mockReturnValue([]);


      renderWithRouter(<Categories />);
      const links = screen.queryAllByRole('link');

      expect(links).toHaveLength(0);
    });
  });

  describe('Categories Display - Single Category', () => {
    test('should render one category link correctly', () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' }
      ];
      useCategory.mockReturnValue(mockCategories);

      renderWithRouter(<Categories />);
      const link = screen.getByRole('link', { name: 'Electronics' });

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/category/electronics');
      expect(link).toHaveClass('btn', 'btn-primary');
    });

    test('should render category with correct column classes', () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' }
      ];
      useCategory.mockReturnValue(mockCategories);

      const { container } = renderWithRouter(<Categories />);
      const columnDiv = container.querySelector('.col-md-6');

      expect(columnDiv).toBeInTheDocument();
      expect(columnDiv).toHaveClass('col-md-6', 'mt-5', 'mb-3', 'gx-3', 'gy-3');
    });
  });

  describe('Categories Display - Multiple Categories', () => {
    test('should render multiple category links correctly', () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' },
        { _id: '3', name: 'Books', slug: 'books' }
      ];
      useCategory.mockReturnValue(mockCategories);

      renderWithRouter(<Categories />);
      const links = screen.getAllByRole('link');

      expect(links).toHaveLength(3);
      expect(screen.getByRole('link', { name: 'Electronics' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Clothing' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Books' })).toBeInTheDocument();
    });

    test('should render each category with correct slug in href', () => {
    
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' }
      ];
      useCategory.mockReturnValue(mockCategories);


      renderWithRouter(<Categories />);
      const electronicsLink = screen.getByRole('link', { name: 'Electronics' });
      const clothingLink = screen.getByRole('link', { name: 'Clothing' });

      expect(electronicsLink).toHaveAttribute('href', '/category/electronics');
      expect(clothingLink).toHaveAttribute('href', '/category/clothing');
    });

    test('should render correct number of column divs for multiple categories', () => {
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' },
        { _id: '3', name: 'Books', slug: 'books' },
        { _id: '4', name: 'Sports', slug: 'sports' }
      ];
      useCategory.mockReturnValue(mockCategories);

      const { container } = renderWithRouter(<Categories />);
      const columnDivs = container.querySelectorAll('.col-md-6');

      expect(columnDivs).toHaveLength(4);
    });
  });


  describe('Edge Cases and Boundary Values', () => {
    test('should handle category with empty name string', () => {
      const mockCategories = [
        { _id: '1', name: '', slug: 'empty-name' }
      ];
      useCategory.mockReturnValue(mockCategories);

      renderWithRouter(<Categories />);
      const link = screen.getByRole('link');

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/category/empty-name');
      expect(link).toHaveTextContent('');
    });

    test('should handle category with very long name', () => {
      const longName = 'A'.repeat(200);
      const mockCategories = [
        { _id: '1', name: longName, slug: 'long-category' }
      ];
      useCategory.mockReturnValue(mockCategories);

      renderWithRouter(<Categories />);
      const link = screen.getByRole('link', { name: longName });

      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent(longName);
    });

    test('should handle large number of categories', () => {
      const mockCategories = Array.from({ length: 100 }, (_, i) => ({
        _id: `id-${i}`,
        name: `Category ${i}`,
        slug: `category-${i}`
      }));
      useCategory.mockReturnValue(mockCategories);

      renderWithRouter(<Categories />);
      const links = screen.getAllByRole('link');

      expect(links).toHaveLength(100);
    });

  });

  describe('useCategory Hook Integration', () => {
    test('should call useCategory hook', () => {
      useCategory.mockReturnValue([]);

      renderWithRouter(<Categories />);

      expect(useCategory).toHaveBeenCalledTimes(1);
      expect(useCategory).toHaveBeenCalledWith();
    });

    test('should use categories returned from useCategory hook', () => {
      const mockCategories = [
        { _id: '1', name: 'Test Category', slug: 'test-category' }
      ];
      useCategory.mockReturnValue(mockCategories);

      renderWithRouter(<Categories />);
      const link = screen.getByRole('link', { name: 'Test Category' });

      expect(link).toBeInTheDocument();
    });
  });
});