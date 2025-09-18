import React from "react";
import { render, screen } from "@testing-library/react";
import About from "./About";
import Layout from "../components/Layout";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div>
    <h1 data-testid="layout-title">{title}</h1>
    {children}
  </div>
));

describe("About Page", () => {
  it("renders Layout with correct title", () => {
    render(<About />);
    expect(screen.getByTestId("layout-title")).toHaveTextContent(
      "About us - Ecommerce app"
    );
  });

  it("renders the image with correct src and alt text", () => {
    render(<About />);
    const img = screen.getByAltText("contactus");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/about.jpeg");
  });

  it("renders the descriptive text", () => {
    render(<About />);
    const paragraph = screen.getByText(/Add text/i);
    expect(paragraph).toBeInTheDocument();
  });

});
