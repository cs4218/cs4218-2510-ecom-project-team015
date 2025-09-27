import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import CreateProduct from "./CreateProduct";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: {},
	success: jest.fn(),
	error: jest.fn(),
}));

jest.mock("../../components/Layout", () => ({
	__esModule: true,
	default: ({ children }) => <div data-testid="mock-layout">{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
	__esModule: true,
	default: () => <div data-testid="mock-admin-menu">AdminMenu</div>,
}));

// Mock created using ChatGPT
jest.mock("antd", () => {
	const React = require("react");
	const Select = ({ children, onChange, ...rest }) => (
		<select
			data-testid={rest["data-testid"] || "mock-select"}
			onChange={(e) => onChange && onChange(e.target.value)}
		>
			{React.Children.map(children, (child) => child)}
		</select>
	);
	Select.Option = ({ children, value }) => <option value={value}>{children}</option>;
	return { Select };
});

// Mock created using ChatGPT
jest.mock("react-router-dom", () => {
	const actual = jest.requireActual("react-router-dom");
	const navigateMock = jest.fn();
	return {
		...actual,
		useNavigate: () => navigateMock,
		__esModule: true,
		__mocks__: { navigateMock },
	};
});

beforeAll(() => {
	global.URL.createObjectURL = jest.fn(() => "blob:mock");
});

beforeEach(() => {
	jest.clearAllMocks();
});

describe('CreateProduct', () => {

});