import axios from "axios";
import React, { useState, useEffect } from "react";
import Orders from "./Orders";
import {render, screen, waitFor, within} from "@testing-library/react";
import {useAuth} from "../../context/auth";
import { useCart } from "../../context/cart";
import { MemoryRouter } from "react-router-dom";
import { useSearch } from "../../context/search";
import { toast } from "react-hot-toast";
import '@testing-library/jest-dom';


jest.mock("axios");
jest.mock("../../context/auth");
jest.mock("../../context/cart");
jest.mock("../../context/search");
jest.mock("react-hot-toast", () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="mock-layout">{children}</div>
));


describe("When rendering orders page", () => {
    beforeEach(() => {
        useCart.mockReturnValue([[], jest.fn()]); // mock the cart hook
        useSearch.mockReturnValue([{}, jest.fn()]); // mock the search hook
        jest.clearAllMocks();
    })
    test("fetches and displays orders correctly if successful, and all details are provided in order", async() => {
        //Arrage
        //mock the useAuth hook to return a fake user and token
        useAuth.mockReturnValue([{token: "mockToken", user: { name: "mockedUser" }}, jest.fn()]);

         const mockedOrder = {
            _id: "orderId",   //order object id sample
            buyer: {_id: "userId", name: "mockedUser"}, 
            products: [{
                _id: "prodId",    //product object id sample
                name: "Jacket",
                slug: "jacket",
                description: "nice jacket",
                price: 12,
                category: "catId",
                quantity: 5,
            }],
            createdAt: new Date(),
            payment: {success: true},
            status: "Not Processed"
        };
        axios.get.mockResolvedValue({data: [mockedOrder]});

        //Act
        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        //assert
        expect(await screen.findByText("mockedUser")).toBeInTheDocument();
        const orderTable = await screen.findAllByRole("row");
        const orderRows = orderTable.slice(1); //we are removing the header row

        orderRows.forEach((row, index) => {
            //this part about cells using within and getAllByRole was generated with ChatGPT
            const cells = within(row).getAllByRole("cell");   //cell is the role of td.

            expect(cells[0]).toHaveTextContent(index + 1);
            expect(cells[1]).toHaveTextContent(mockedOrder.status);
            expect(cells[2]).toHaveTextContent(mockedOrder.buyer.name);
            expect(cells[3]).toHaveTextContent("a few seconds ago");
            expect(cells[4]).toHaveTextContent("Success");
            expect(cells[5]).toHaveTextContent(mockedOrder.products.length);
        })

        const image = screen.getByTestId(`product-img-prodId`);
        expect(image).toHaveAttribute("src", "/api/v1/product/product-photo/prodId");
        expect(screen.getByTestId(`product-name-prodId`)).toHaveTextContent(mockedOrder.products[0].name);
        expect(screen.getByTestId(`product-desc-prodId`)).toHaveTextContent(mockedOrder.products[0].description.substring(0, 30));
        expect(screen.getByTestId(`product-price-prodId`)).toHaveTextContent(`Price : ${mockedOrder.products[0].price}`);
    });

    test("fetches and displays order when multiple products added and payment option failed", async() => {
        //Arrage
        //mock the useAuth hook to return a fake user and token
        useAuth.mockReturnValue([{token: "mockToken", user: { name: "mockedUser" }}, jest.fn()]);

         const mockedOrder = {
            _id: "orderId",   //order object id sample
            buyer: {_id: "userId", name: "mockedUser"}, 
            products: [{
                _id: "prodId",    //product object id sample
                name: "Jacket",
                slug: "jacket",
                description: "nice jacket",
                price: 12,
                category: "catId",
                quantity: 5,
            },
            {
                _id: "prodId2",    //same product added twice to order
                name: "Jeans",
                slug: "jeans",
                description: "blue jeans",
                price: 112,
                category: "catId",
                quantity: 5,
            }],
            createdAt: new Date(),
            payment: {},
            status: "Not Processed"
        };
        axios.get.mockResolvedValue({data: [mockedOrder]});

        //Act
        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        //assert
        expect(await screen.findByText("mockedUser")).toBeInTheDocument();
        const orderTable = await screen.findAllByRole("row");
        const orderRows = orderTable.slice(1); //we are removing the header row

        orderRows.forEach((row, index) => {
            //this part about cells using within and getAllByRole was generated with ChatGPT
            const cells = within(row).getAllByRole("cell");   //cell is the role of td.

            expect(cells[0]).toHaveTextContent(index + 1);
            expect(cells[1]).toHaveTextContent(mockedOrder.status);
            expect(cells[2]).toHaveTextContent(mockedOrder.buyer.name);
            expect(cells[3]).toHaveTextContent("a few seconds ago");
            expect(cells[4]).toHaveTextContent("Failed");
            expect(cells[5]).toHaveTextContent(mockedOrder.products.length);  // number of products
        });

        mockedOrder.products.forEach((item, index) => {
            const image = screen.getByTestId(`product-img-${item._id}`);
            expect(image).toHaveAttribute("src", `/api/v1/product/product-photo/${item._id}`);
            expect(screen.getByTestId(`product-name-${item._id}`)).toHaveTextContent(mockedOrder.products[index].name);
            expect(screen.getByTestId(`product-desc-${item._id}`)).toHaveTextContent(mockedOrder.products[index].description.substring(0, 30));
            expect(screen.getByTestId(`product-price-${item._id}`)).toHaveTextContent(`Price : ${mockedOrder.products[index].price}`);
        });
    });

    test("logs error and displays toast message if request rejected by backend", async() => {
        useAuth.mockReturnValue([{ token: "invalidToken", user: {name: "mockedUser" }}, jest.fn()]);   //invalid token
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        const mockedOrder = {
            _id: "orderId",   //order object id sample
            buyer: {_id: "userId", name: "mockedUser"}, 
            products: [{
                _id: "prodId",    //product object id sample
                name: "Jacket",
                slug: "jacket",
                description: "nice jacket",
                price: 12,
                category: "catId",
                quantity: 5,
            }],
            createdAt: new Date(),
            payment: {},
            status: "Not Processed"
        };

        axios.get.mockRejectedValue({
            response: { status: 401, data: { message: "Unauthorized" } },
        });

        //Act
        render(
            <MemoryRouter>
                <Orders />
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

    test("getOrders not called when token does not exist", async() => {
        useAuth.mockReturnValue([{user: {name: "abc"}}, jest.fn()]); //token does not exist
        Orders.getOrders = jest.fn();
        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        expect(Orders.getOrders).not.toHaveBeenCalled();
    });

    test("toast message displayed if error response does not contain data", async() => {
        useAuth.mockReturnValue([{ token: "invalidToken", user: {name: "mockedUser" }}, jest.fn()]);
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        axios.get.mockRejectedValue({
        });

        //Act
        render(
            <MemoryRouter>
                <Orders />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenLastCalledWith(expect.objectContaining({}));
        });
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });
});