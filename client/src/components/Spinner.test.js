import React from "react";
import { render, screen, act } from "@testing-library/react";
import Spinner from "./Spinner";
import { useNavigate, useLocation } from "react-router-dom";

// Mock react-router-dom hooks once
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("Spinner Component", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ pathname: "/test" });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders initial countdown and spinner", () => {
    render(<Spinner path="login" />);
    expect(screen.getByText(/redirecting to you in\s*3\s*second/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("counts down and navigates when count reaches 0", () => {
    render(<Spinner path="login" />);

    // Initial count
    expect(screen.getByText(/redirecting to you in\s*3\s*second/i)).toBeInTheDocument();

    // 1 second later
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/redirecting to you in\s*2\s*second/i)).toBeInTheDocument();

    // 2 more seconds later (total 3 seconds)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Navigate should have been called
    expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/test" });
  });
});
