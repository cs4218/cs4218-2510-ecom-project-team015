import React from 'react';
import axios from 'axios';
import { render, screen } from '@testing-library/react';
import {useAuth} from "../../context/auth";
import PrivateRoute from "./Private.js"


jest.mock('axios'); //mock axios to isolate for unit testing

// mock the spinner
jest.mock("../Spinner", () => () => <div>Spinner loading</div>);

// mock auth
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));


const Outlet = () => <div>Protected content</div>
// mock the outlet since we are not mounting full tree. Simply display this if we are allowed to access protected page.
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    Outlet
}));

describe('Given a req to access PrivateRoute', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Renders spinner when auth fails', async () => {   //Token exists, but invalid
        //client side, token valid and user exists
        useAuth.mockReturnValue([{ token: "valid-token", user: 'someRandomUser' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: false } });   //Server side rejects token
        render(<PrivateRoute />);   //ideally must load spinner.

        const spinner = await screen.findByText("Spinner loading");
        expect(spinner).toBeInTheDocument();
    })

    test('Renders spinner when no token', async () => { //Token does not exist.
        //client side must reject since token does not exist.
        useAuth.mockReturnValue([{ token: null, user: 'someRandomUser'}, jest.fn()]);
        //if token doesn't exist, don't do server side verification
        expect(axios.get).not.toHaveBeenCalled();
        render(<PrivateRoute />);   //Ideally must load spinner.

        const spinner = await screen.findByText("Spinner loading"); 
        expect(spinner).toBeInTheDocument();
    })

    test('renders outlet when token exists and auth passes', async () => {
        useAuth.mockReturnValue([{token: 'valid-token', user: 'someRandomUser'}, jest.fn()]);
        axios.get.mockResolvedValue({ data: {ok: true}});
        render(
            <PrivateRoute />
        );

        // Wait for Outlet content to appear
        const protectedContent = await screen.findByText("Protected content");
        expect(protectedContent).toBeInTheDocument();
    });
});
