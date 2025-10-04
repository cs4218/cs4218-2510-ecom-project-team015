import React from "react";
import { render, screen } from "@testing-library/react";
import Policy from "./Policy";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({ children, title }) => (
    <div>
        <h1 data-testid="layout-title">{title}</h1>
        {children}
    </div>
));

describe("Policy Page", () => {
    beforeEach(() => {
        render(<Policy />);
        jest.clearAllMocks();
    })

    it("should render Layout component in the page correctly", () => {
        // Check whether the layout component is rendered with correct title
        expect(screen.getByTestId("layout-title")).toBeInTheDocument();
        expect(screen.getByTestId("layout-title")).toHaveTextContent(
            "Privacy Policy - Ecommerce app"
        );
    });

    it("should render the main heading of the page", () => {
        const heading = screen.getByText("Privacy Policy");

        // Check whether the heading is correctly rendered
        expect(heading).toBeInTheDocument();
    });

    it("should render effective date in the page", () => {
        const heading = screen.getByText(/Effective Date: 4 October 2025/i);

        // Check whether the heading is correctly rendered
        expect(heading).toBeInTheDocument();
    });

    it("should render sub-heading 1 with the correct text", () => {
        const subheading1 = screen.getByText(/1. Information We Collect/i);
        const text = screen.getByText(/We may collect personal details like name, email, phone number, address, date of birth, and payment information./i);
        
        // Check whether the sub-heading and text are correctly rendered
        expect(subheading1).toBeInTheDocument();
        expect(text).toBeInTheDocument();
    });

    it("should render sub-heading 2 with the correct text", () => {
        const subheading2 = screen.getByText(/2. How We Use Your Information/i);
        const text = screen.getByText(/We use your information to process orders, provide customer support, improve services, send updates, and ensure secure payments./i);
        
        // Check whether the sub-heading and text are correctly rendered
        expect(subheading2).toBeInTheDocument();
        expect(text).toBeInTheDocument();
    });

    it("should render sub-heading 3 with the correct text", () => {
        const subheading3 = screen.getByText(/3. Sharing of Information/i);
        const text = screen.getByText(/We do not sell your data. We only share it with service providers \(payment, shipping\) or when legally required./i);
        
        // Check whether the sub-heading and text are correctly rendered
        expect(subheading3).toBeInTheDocument();
        expect(text).toBeInTheDocument();
    });

    it("should render sub-heading 4 with the correct text", () => {
        const subheading4 = screen.getByText(/4. Data Security/i);
        const text = screen.getByText(/We use reasonable measures to protect your data but cannot guarantee complete security./i);
        
        // Check whether the sub-heading and text are correctly rendered
        expect(subheading4).toBeInTheDocument();
        expect(text).toBeInTheDocument();
    });

    it("should render sub-heading 5 with the correct text", () => {
        const subheading5 = screen.getByText(/5. Your Rights/i);
        const text = screen.getByText(/You can access, update, or delete your information, and request a copy of your data./i);
        
        // Check whether the sub-heading and text are correctly rendered
        expect(subheading5).toBeInTheDocument();
        expect(text).toBeInTheDocument();
    });
});
