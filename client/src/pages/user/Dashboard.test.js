import React from 'react';
import {screen, render} from '@testing-library/react';
import Dashboard from './Dashboard';
import {useAuth} from "../../context/auth";
import {MemoryRouter} from 'react-router-dom';

// mock the hook for unit testing
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

//Mock the entire layout and place children in the mock
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));

// Mock the usermenu
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="mock-user-menu">Mocked User Menu
    <h4>Dashboard</h4>
  </div>
));

describe("testing dashboard page", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('when user is available', () => {
        useAuth.mockReturnValue([{ user: {name: 'randomName', email: 'randomEmail@email.com', address: 'random address'}, token: "valid-token" }, jest.fn()]);
        render(
           <MemoryRouter>
                <Dashboard />
           </MemoryRouter>
        );
        const h4 = screen.getByRole('heading', {level: 4});
        expect(h4).toHaveTextContent('Dashboard');

        const userName = screen.getByText('randomName');
        expect(userName).toBeInTheDocument();
        
        const userEmail = screen.getByText('randomEmail@email.com');
        expect(userEmail).toBeInTheDocument();

        const userAddress = screen.getByText('random address');
        expect(userAddress).toBeInTheDocument();
    })

    test("when user is missing", () => {
        useAuth.mockReturnValue([{}, jest.fn()]);

        render(
            <MemoryRouter>
            <Dashboard />
            </MemoryRouter>
    );

        const h4 = screen.getByRole('heading', {level: 4});
        expect(h4).toHaveTextContent('Dashboard');

        // There should still be 3 <h3> tags but empty
        const userHeaders = screen.getAllByRole('heading', {level: 3});
        expect(userHeaders.length).toBe(3);
        userHeaders.forEach(h3 => expect(h3).toBeEmptyDOMElement());
    });
});
