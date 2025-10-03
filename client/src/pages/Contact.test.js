import React from "react";
import { render, screen } from "@testing-library/react";
import Contact from "./Contact";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({ children, title }) => (
    <div>
        <h1 data-testid="layout-title">{title}</h1>
        {children}
    </div>
));

describe("Contact Page", () => {
    beforeEach(() => {
        render(<Contact />);
        jest.clearAllMocks();
    })

    it("should render Layout component in the page correctly", () => {
        // Check whether the layout component is rendered with correct title
        expect(screen.getByTestId("layout-title")).toBeInTheDocument();
        expect(screen.getByTestId("layout-title")).toHaveTextContent(
            "Contact Us - Ecommerce app"
        );
    });

    it("should render the image with correct src and alt text", () => {
        const img = screen.getByAltText("Contact Us Image");

        // Check whether the image is correctly rendered
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/images/contactus.jpeg");
    });

    it("should render the heading of the page", () => {
        const heading = screen.getByText("CONTACT US");

        // Check whether the heading is correctly rendered
        expect(heading).toBeInTheDocument();
    });

    it("should render the descriptive text in the page", () => {
        const paragraph = screen.getByText(/For any query or info about product, feel free to call anytime. We are available 24X7./i);

        // Check whether the descriptive text is correctly rendered
        expect(paragraph).toBeInTheDocument();
    });

    it("should check whether the email is rendered with the icon", () => {
        const email = screen.getByText(/: www.help@ecommerceapp.com/i);
        const icon = screen.getByTestId("email-icon");

        // Check whether the email is correctly rendered with the icon
        expect(email).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
    });

    it("should check whether the phone number is rendered with the icon", () => {
        const phone = screen.getByText(/: 012-3456789/i);
        const icon = screen.getByTestId("phone-icon");

        // Check whether the phone number is correctly rendered with the icon
        expect(phone).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
    });

    it("should check whether the support number is rendered with the icon", () => {
        const support = screen.getByText(/: 1800-0000-0000 \(Toll Free\)/i);
        const icon = screen.getByTestId("support-icon");

        // Check whether the support number is correctly rendered with the icon
        expect(support).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
    });
});

