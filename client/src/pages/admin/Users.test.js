import axios from 'axios';
import {toast} from 'react-hot-toast';
import moment from 'moment';
import React, {useEffect, useState} from 'react';
import { useAuth } from '../../context/auth';
import { render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Users from './Users';

jest.mock('axios');
jest.mock("../../context/auth");

jest.mock("../../components/AdminMenu");
jest.mock("react-hot-toast");
toast.success = jest.fn();
toast.error = jest.fn();

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));

describe("Users page rendering", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Page renders when there are no users", async () => {
        const mockedUsers = []
        const auth = {token: "validToken", user: {
            name: "validName",
            email: "valid@email.com",
            phone: "98989898",
            password: "oldHashedPwd",
            address: "example address"
            }
        };
        useAuth.mockReturnValue([auth, jest.fn()]);

        axios.get.mockResolvedValue({data: mockedUsers});

        // act
        render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );

        //assert
        expect(screen.getByText(/#/i)).toBeInTheDocument();
        expect(screen.getByText(/Name/i)).toBeInTheDocument();
        expect(screen.getByText(/Email/i)).toBeInTheDocument();
        expect(screen.getByText(/Account Creation/i)).toBeInTheDocument();
        expect(screen.getByText(/Phone/i)).toBeInTheDocument();
        expect(screen.getByText(/Address/i)).toBeInTheDocument();
        expect(screen.getByText(/DOB/i)).toBeInTheDocument();
    });

    test("Page renders correctly with all users displayed", async () => {
        const mockedUsers = [{
            _id: "user1",
            name: "userName",
            email: "email1@gmail.com",
            phone: "89898989",
            createdAt: new Date(),
            DOB: "2002-12-12",
            address: "abc"
        },
        {
            _id: "user2",
            name: "userName2",
            email: "email2@gmail.com",
            phone: "89898789",
            createdAt: new Date(),
            DOB: "2002-11-12",
            address: "abcdd"
        },
        ]
        const auth = {token: "validToken", user: {
            name: "validName",
            email: "valid@email.com",
            phone: "98989898",
            password: "oldHashedPwd",
            address: "example address"
            }
        };
        useAuth.mockReturnValue([auth, jest.fn()]);

        axios.get.mockResolvedValue({data: mockedUsers});

        // act
        render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );

        //assert
        for (let index = 0; index < mockedUsers.length; index++) {
            const user = mockedUsers[index];
            const nameCell = await screen.findByText(user.name); // single <td>
            const row = nameCell.closest("tr"); //Generated with ChatGPT
            const cells = within(row).getAllByRole("cell"); // get <td>

            expect(cells[0]).toHaveTextContent(index + 1);
            expect(cells[1]).toHaveTextContent(user.name);
            expect(cells[2]).toHaveTextContent(user.email);
            expect(cells[3]).toHaveTextContent(moment(user.createdAt).fromNow());
            expect(cells[4]).toHaveTextContent(user.phone);
            expect(cells[5]).toHaveTextContent(user.address);
            expect(cells[6]).toHaveTextContent(new Date(user.DOB).toLocaleDateString());
        }
    });

    test("Logs error and shows error toast if there is a server error", async() => {
        useAuth.mockReturnValue([{ token: "invalidToken", user: {name: "mockedUser" }}, jest.fn()]);   //invalid token
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        axios.get.mockRejectedValue({
            response: { status: 401, data: { message: "Unauthorized" } },
        });

        //Act
        render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenLastCalledWith(expect.objectContaining({
                response: {status: 401, data: { message: 'Unauthorized'}}
            }));
        });
        await waitFor(() => {
            expect(toast.error).toHaveBeenLastCalledWith("Unauthorized");
        });
    });
    test("Logs error and shows predefined error toast msg if error.response is undefined", async() => {
        useAuth.mockReturnValue([{ token: "invalidToken", user: {name: "mockedUser" }}, jest.fn()]);   //invalid token
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        axios.get.mockRejectedValue({});

        //Act
        render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenLastCalledWith(expect.objectContaining({}));
        });
        await waitFor(() => {
            expect(toast.error).toHaveBeenLastCalledWith("Error fetching all users");
        });
    });

    test("axios not called when token does not exist", async() => {
        useAuth.mockReturnValue([{user: {name: "abc"}}, jest.fn()]); //token does not exist
        Users.getUsers = jest.fn();
        render(
            <MemoryRouter>
                <Users />
            </MemoryRouter>
        );

        expect(axios.get).not.toHaveBeenCalled();
    });
});