import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Footer from "./Footer";

describe("Footer Component", () => {
  it("renders footer text", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      getByText(/All Rights Reserved © TestingComp/i)
    ).toBeInTheDocument();
  });

  it("renders About, Contact and Privacy Policy links", () => {
    const { getByText } = render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(getByText("About")).toBeInTheDocument();
    expect(getByText("Contact")).toBeInTheDocument();
    expect(getByText("Privacy Policy")).toBeInTheDocument();
  });
});
