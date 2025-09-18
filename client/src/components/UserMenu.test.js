import React from 'react';
import {MemoryRouter} from "react-router-dom";
import {render, screen, cleanup} from '@testing-library/react';
import UserMenu from './UserMenu';

afterEach(() => {
    cleanup(); // Resets after each test suite
})

describe("Testing if components in UserMenu appear as expected", () => {
    test("check if 'Dashboard' heading appears", () => {
        render(
        <MemoryRouter>
            <UserMenu />    
        </MemoryRouter>
        );
        const h4 = screen.getByRole('heading', {level: 4});
        expect(h4).toHaveTextContent('Dashboard');
    })
    
    test("check if profile element renders correctly", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );
        const profileLink = screen.getByRole('link', {name: 'Profile'});
        expect(profileLink).toBeInTheDocument();
        expect(profileLink).toHaveAttribute("href", "/dashboard/user/profile");
    })

    test("check if orders element renders correctly", () => {
        render(
            <MemoryRouter>
                <UserMenu />
            </MemoryRouter>
        );
        const orderLink = screen.getByRole('link', {name: 'Orders'});
        expect(orderLink).toBeInTheDocument();
        expect(orderLink).toHaveAttribute("href", "/dashboard/user/orders");
    })
})
