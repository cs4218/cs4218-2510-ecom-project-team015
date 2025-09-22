import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from './Layout';

// Correctly mock Header and Footer components
jest.mock('./Header', () => {
  return () => <div data-testid="mock-header">Header</div>;
});
jest.mock('./Footer', () => {
  return () => <div data-testid="mock-footer">Footer</div>;
});

// Mock the Toaster component from react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => <div data-testid="mock-toaster">Mock Toaster</div>,
}));

describe('Layout Component', () => {
  it('renders header, footer, and children', () => {
    const { getByTestId, getByText } = render(
      <Layout>
        <p>Child content</p>
      </Layout>
    );

    expect(getByTestId('mock-header')).toBeInTheDocument();
    expect(getByTestId('mock-footer')).toBeInTheDocument();
    expect(getByText('Child content')).toBeInTheDocument();
  });

});