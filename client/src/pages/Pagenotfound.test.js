import React from "react";
import { render } from "@testing-library/react";
import Pagenotfound from "./Pagenotfound";
import Layout from "../components/Layout";
import { MemoryRouter } from "react-router-dom";

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div>
    <h1 data-testid="layout-title">{title}</h1>
    {children}
  </div>
));

describe("Pagenotfound Component", () => {
  it("renders Layout with correct title", () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );
    const layoutTitle = getByTestId("layout-title");
    expect(layoutTitle).toHaveTextContent("go back- page not found");
  });

  it("renders 404 title and heading", () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );
    const title = container.querySelector(".pnf-title");
    const heading = container.querySelector(".pnf-heading");

    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent("404");

    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Oops ! Page Not Found");
  });

  it("renders Go Back link with correct href", () => {
    const { container } = render(
      <MemoryRouter>
        <Pagenotfound />
      </MemoryRouter>
    );
    const link = container.querySelector(".pnf-btn");
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/");
    expect(link).toHaveTextContent("Go Back");
  });
});
