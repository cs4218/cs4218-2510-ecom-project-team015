import { test, expect } from "@playwright/test";

async function mockHomePageApis(
	page,
	{ total = 3, page1 = [], page2 = [] } = {}
) {
	await page.route("**/api/v1/category/get-category", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				success: true,
				category: [
					{ _id: "cat1", name: "Electronics" },
					{ _id: "cat2", name: "Books" },
				],
			}),
		});
	});

	await page.route("**/api/v1/product/product-count", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ total }),
		});
	});

	await page.route("**/api/v1/product/product-list/1", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ products: page1 }),
		});
	});

	await page.route("**/api/v1/product/product-list/2", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ products: page2 }),
		});
	});
}

test.describe("HomePage UI", () => {
	test("renders banner, filters and initial products", async ({ page }) => {
		const firstPage = [
			{
				_id: "p1",
				name: "Phone",
				slug: "phone",
				description: "Smart phone x",
				price: 299,
			},
			{
				_id: "p2",
				name: "Book",
				slug: "book",
				description: "Good book",
				price: 19,
			},
			{
				_id: "p3",
				name: "Headset",
				slug: "headset",
				description: "Nice sound",
				price: 79,
			},
		];
		await mockHomePageApis(page, { total: 5, page1: firstPage });

		await page.goto("/");

		await expect(page.getByRole("img", { name: "bannerimage" })).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /All Products/i })
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Filter By Category/i })
		).toBeVisible();
		await expect(
			page.getByRole("heading", { name: /Filter By Price/i })
		).toBeVisible();

		const cards = page.locator(".card");
		await expect(cards).toHaveCount(3);
		await expect(
			page.getByRole("heading", { level: 5, name: "Phone" })
		).toBeVisible();
		await expect(
			page.getByRole("heading", { level: 5, name: "Book" })
		).toBeVisible();
		await expect(
			page.getByRole("heading", { level: 5, name: "Headset" })
		).toBeVisible();
	});

	test("load more appends new products (pagination)", async ({ page }) => {
		const firstPage = [
			{
				_id: "p1",
				name: "Phone",
				slug: "phone",
				description: "Smart phone x",
				price: 299,
			},
			{
				_id: "p2",
				name: "Book",
				slug: "book",
				description: "Good book",
				price: 19,
			},
		];
		const secondPage = [
			{
				_id: "p3",
				name: "Mouse",
				slug: "mouse",
				description: "Wireless mouse",
				price: 25,
			},
			{
				_id: "p4",
				name: "Keyboard",
				slug: "keyboard",
				description: "Mechanical keyboard",
				price: 89,
			},
		];
		await mockHomePageApis(page, {
			total: 4,
			page1: firstPage,
			page2: secondPage,
		});

		await page.goto("/");

		const cards = page.locator(".card");
		await expect(cards).toHaveCount(2);

		const loadMoreBtn = page.getByRole("button", { name: /Loadmore/i });
		await loadMoreBtn.click();

		await expect(cards).toHaveCount(4);
		await expect(
			page.getByRole("heading", { level: 5, name: "Mouse" })
		).toBeVisible();
		await expect(
			page.getByRole("heading", { level: 5, name: "Keyboard" })
		).toBeVisible();
	});

	test("add to cart stores item in localStorage", async ({ page }) => {
		const firstPage = [
			{
				_id: "p1",
				name: "Phone",
				slug: "phone",
				description: "Smart phone x",
				price: 299,
			},
		];
		await mockHomePageApis(page, { total: 1, page1: firstPage });

		await page.goto("/");

		const addToCart = page.getByRole("button", { name: /ADD TO CART/i });
		await addToCart.click();

		const cartJson = await page.evaluate(() => localStorage.getItem("cart"));
		expect(cartJson).not.toBeNull();
		const cart = JSON.parse(cartJson);
		expect(cart).toHaveLength(1);
		expect(cart[0]._id).toBe("p1");
	});
});
