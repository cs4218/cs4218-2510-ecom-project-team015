import http from "k6/http";
import { check, group, sleep } from "k6";
import { randomItem, randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";
import { Counter } from "k6/metrics";

// Created Using ChatGPT

export const branch_quick = new Counter("branch_quick");
export const branch_standard = new Counter("branch_standard");
export const branch_checkout = new Counter("branch_checkout");
export const branch_abandon = new Counter("branch_abandon");
export const branch_merge = new Counter("branch_merge");

const REGISTER_RATIO = 0.2;
const THINK_MIN = 1;
const THINK_MAX = 3;

let QUICK_BUY_RATIO = 0.3;
let ABANDON_RATIO = 0.25;
let CHECKOUT_RATIO = 0.4;

export function setCheckoutRatio(v) {
	CHECKOUT_RATIO = v;
}
export function setQuickBuyRatio(v) {
	QUICK_BUY_RATIO = v;
}
export function setAbandonRatio(v) {
	ABANDON_RATIO = v;
}

// URL map
const BASE = "http://localhost:3000";
const API = `api/v1`;
export const URLS = {
	list1: `${BASE}/${API}/product/product-list/1`,
	list2: `${BASE}/${API}/product/get-product`,
	pdp: (slug) => `${BASE}/${API}/product/get-product/${slug}`,
	related: (pid, cid) => `${BASE}/${API}/product/related-product/${pid}/${cid}`,
	photo: (pid) => `${BASE}/${API}/product/product-photo/${pid}`,

	// Auth
	login: `${BASE}/${API}/auth/login`,
	register: `${BASE}/${API}/auth/register`,
	userAuth: `${BASE}/${API}/auth/user-auth`,
	orders: `${BASE}/${API}/auth/orders`,

	// Cart
	cartGet: `${BASE}/${API}/cart`,
	cartAdd: `${BASE}/${API}/cart/add`,
	cartRemoveIndex: (i) => `${BASE}/${API}/cart/remove/${i}`,
	cartClear: `${BASE}/${API}/cart/clear`,
	cartMerge: `${BASE}/${API}/cart/merge`,

	// Checkout (Braintree)
	btToken: `${BASE}/${API}/product/braintree/token`,
	btPay: `${BASE}/${API}/product/braintree/payment`,
};

// Headers
const COMMON_GET_HEADERS = {
	Accept: "application/json",
	"Cache-Control": "no-cache",
	Pragma: "no-cache",
};
const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

const TOKENS = new Map();

function sleepThink() {
	sleep(randomIntBetween(THINK_MIN, THINK_MAX));
}

function ok2xxOr304(res) {
	return (
		res && (res.status === 200 || res.status === 201 || res.status === 204 || res.status === 304)
	);
}

function parseJSONSafe(res) {
	try {
		return JSON.parse(res.body);
	} catch (_) {
		return null;
	}
}

function getNoCache(url, name, headers = COMMON_GET_HEADERS) {
	const r1 = http.get(url, { headers, tags: { name } });
	if (r1.status === 304 || !r1.body) {
		const sep = url.includes("?") ? "&" : "?";
		return http.get(`${url}${sep}nocache=1`, { headers, tags: { name } });
	}
	return r1;
}

function withToken(token) {
	return { headers: { ...JSON_HEADERS, Authorization: token } };
}

// Prouct list
function fetchAnyProductList() {
	let res = getNoCache(URLS.list1, "list1");

	if (!(res.status === 200)) {
		res = getNoCache(URLS.list2, "list2");
	}

	if (!(res.status === 200)) {
		sleep(0.25);
		res = getNoCache(URLS.list1, "list1_retry");
	}

	const ok = check(res, { "list ok (2xx/304)": (r) => r.status === 200 || r.status === 304 });
	if (!ok) return { products: [], chosen: null, baseRes: res };

	const data = parseJSONSafe(res);
	let products = [];
	if (Array.isArray(data)) products = data;
	else if (data && Array.isArray(data.products)) products = data.products;
	else if (data && Array.isArray(data.data)) products = data.data;

	// light filtering
	products = products.filter((p) => p && (p._id || p.id) && (p.slug || p.name));
	if (!products.length) return { products: [], chosen: null, baseRes: res };

	const chosen = randomItem(products);
	return { products, chosen, baseRes: res };
}

// Fetch PDP and related/photo
function touchPdpAndMore(prod) {
	const pid = prod._id || prod.id;
	const slug = prod.slug || String(pid);
	const cid = prod.category?._id || prod.categoryId || prod.category || "unknown";

	let okSel = check(
		{ pid, slug },
		{
			"selected product id": (v) => Boolean(v.pid),
		}
	);
	if (!okSel) return;

	// PDP
	const pdpRes = getNoCache(URLS.pdp(slug), "pdp", COMMON_GET_HEADERS);
	check(pdpRes, { "pdp ok (2xx/304)": ok2xxOr304 });

	// Related
	if (Math.random() < 0.6 && cid !== "unknown") {
		const relRes = getNoCache(URLS.related(pid, cid), "related", COMMON_GET_HEADERS);
		check(relRes, { "related ok (2xx/304)": ok2xxOr304 });
	}

	// Photo
	if (Math.random() < 0.8) {
		const phRes = getNoCache(URLS.photo(pid), "photo", {
			Accept: "*/*",
			"Cache-Control": "no-cache",
			Pragma: "no-cache",
		});
		check(phRes, {
			"photo ok (2xx/204/304)": (r) =>
				r && (r.status === 200 || r.status === 204 || r.status === 304),
		});
	}
}

// Light search/filter
function touchSearchVariant() {
	const kw = randomItem(["t-shirt", "book", "phone", "toy", "laptop"]);
	const url = `${URLS.list2}?keyword=${encodeURIComponent(kw)}`;
	const res = getNoCache(url, "search", COMMON_GET_HEADERS);
	check(res, { "search list ok (2xx/304)": ok2xxOr304 });
}

// Auth helpers
function loginOrGetToken() {
	const cached = TOKENS.get(__VU);
	if (cached) return cached;

	const email = "known.user@example.com";
	const password = "Password123!";
	const payload = JSON.stringify({ email, password });
	let res = http.post(URLS.login, payload, { headers: JSON_HEADERS, tags: { name: "login" } });
	const ok200 = res.status === 200;
	check(res, { "login 200": () => ok200 });

	if (!ok200 && res.status === 404) {
		// Auto-create baseline user then retry login
		const regPayload = JSON.stringify({
			name: "Baseline User",
			email,
			password,
			phone: sgPhone(),
			address: "1 Example Street",
			DOB: "2000-01-01",
			answer: "football",
		});
		const reg = http.post(URLS.register, regPayload, {
			headers: JSON_HEADERS,
			tags: { name: "register_auto" },
		});

		check(reg, {
			"baseline user ensured (2xx/409)": (r) =>
				(r.status >= 200 && r.status < 300) || r.status === 409,
		});

		res = http.post(URLS.login, payload, {
			headers: JSON_HEADERS,
			tags: { name: "login_retry" },
		});

		check(res, { "login 200 (retry)": (r) => r.status === 200 });
	}

	const json = parseJSONSafe(res);
	const token = json?.token || json?.data?.token;
	if (token) TOKENS.set(__VU, token);
	return token || null;
}

function sgPhone() {
	const start = Math.random() < 0.5 ? "8" : "9";
	let rest = "";
	for (let i = 0; i < 7; i++) rest += Math.floor(Math.random() * 10);
	return start + rest;
}

function maybeRegisterThenLogin() {
	if (Math.random() >= REGISTER_RATIO) {
		return loginOrGetToken();
	}

	const email = `test+${__VU}-${__ITER}-${Date.now()}@example.com`;
	const payload = JSON.stringify({
		name: "Test User",
		email,
		password: "Password123!",
		phone: sgPhone(),
		address: "1 Example Street",
		DOB: "2000-01-01",
		answer: "football",
	});
	const reg = http.post(URLS.register, payload, {
		headers: JSON_HEADERS,
		tags: { name: "register" },
	});
	check(reg, { "register 2xx": (r) => r.status >= 200 && r.status < 300 });
	sleepThink();

	// login with the new user
	const lres = http.post(URLS.login, JSON.stringify({ email, password: "Password123!" }), {
		headers: JSON_HEADERS,
		tags: { name: "login_after_register" },
	});
	check(lres, { "login after register 200": (r) => r.status === 200 });
	const json = parseJSONSafe(lres);
	const token = json?.token || json?.data?.token;
	if (token) TOKENS.set(__VU, token);
	return token || null;
}

// Cart helpers
function tryCartAdd(token, pid) {
	const primary = http.post(URLS.cartAdd, JSON.stringify({ productId: String(pid) }), {
		...withToken(token),
		tags: { name: "cart_add" },
	});
	if (primary && primary.status >= 200 && primary.status < 300) {
		return { ok: true, res: primary, variant: "productId" };
	}

	const variants = [
		{ productId: String(pid), quantity: 1 },
		{ productId: String(pid), qty: 1 },
	];
	for (const body of variants) {
		const res = http.post(URLS.cartAdd, JSON.stringify(body), {
			...withToken(token),
			tags: { name: "cart_add_variant" },
		});
		if (res && res.status >= 200 && res.status < 300) return { ok: true, res, variant: body };
	}
	return { ok: false };
}

// Browse Flow
// includes product list, product details page(PDP), related products, photo, search/filter
export function browseFlow() {
	group("flow:browse", function () {
		const list = fetchAnyProductList();

		if (list.chosen) {
			sleepThink();
			touchPdpAndMore(list.chosen);
			sleepThink();
			if (Math.random() < 0.5) touchSearchVariant();
		}
	});
}

// Cart Flow
// includes auth, cart add, optional checkout/abandon
export function cartFlow() {
	group("flow:cart", function () {
		const { chosen } = fetchAnyProductList();
		if (!chosen) return;
		const pid = chosen._id || chosen.id;

		// Path selection
		const roll = Math.random();
		const isQuick = roll < QUICK_BUY_RATIO;
		const isAbandon = roll >= QUICK_BUY_RATIO && roll < QUICK_BUY_RATIO + ABANDON_RATIO;

		if (isQuick) branch_quick.add(1);
		else branch_standard.add(1);

		// Auth strategy
		const token = isQuick ? loginOrGetToken() : maybeRegisterThenLogin();
		if (!token) return;
		sleepThink();

		// Add items
		const adds = isQuick ? 1 : randomIntBetween(1, 3);
		let added = 0;
		for (let i = 0; i < adds; i++) {
			const out = tryCartAdd(token, pid);
			check(out, { "cart add 2xx/201/204": (o) => o && o.ok });
			if (out.ok) added++;
			sleepThink();
		}

		// Read cart
		const cartRes1 = getNoCache(URLS.cartGet, "cart_get", {
			...JSON_HEADERS,
			Authorization: token,
			"Cache-Control": "no-cache",
			Pragma: "no-cache",
		});
		let cartJson = parseJSONSafe(cartRes1);
		let items =
			cartJson?.cart ||
			cartJson?.data?.cart ||
			(Array.isArray(cartJson) ? cartJson : []) ||
			cartJson?.items ||
			[];

		if (!Array.isArray(items) || items.length === 0) {
			sleep(0.2);
			const cartRes2 = getNoCache(URLS.cartGet, "cart_get_retry", {
				...JSON_HEADERS,
				Authorization: token,
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			});
			cartJson = parseJSONSafe(cartRes2);
			items =
				cartJson?.cart ||
				cartJson?.data?.cart ||
				(Array.isArray(cartJson) ? cartJson : []) ||
				cartJson?.items ||
				[];
		}

		const hasItems = Array.isArray(items) && items.length > 0;

		// Merge cart occasionally if items present
		if (hasItems && Math.random() < 0.3) {
			branch_merge.add(1);
			const merge = http.post(URLS.cartMerge, JSON.stringify({ cart: items }), {
				...withToken(token),
				tags: { name: "cart_merge" },
			});
			check(merge, { "cart merge 2xx": (r) => r.status >= 200 && r.status < 300 });
		}

		// Checkout decision
		const localCheckout = isQuick ? 0.9 : CHECKOUT_RATIO;
		const doCheckout = Math.random() < localCheckout && hasItems;

		if (doCheckout) {
			branch_checkout.add(1);
			const tok = http.get(URLS.btToken, {
				headers: { ...JSON_HEADERS, Authorization: token },
				tags: { name: "bt_token" },
			});
			check(tok, { "bt token 200": (r) => r.status === 200 });
			const payBody = JSON.stringify({ nonce: "fake-valid-nonce", cart: items });
			const pay = http.post(URLS.btPay, payBody, {
				...withToken(token),
				tags: { name: "bt_pay" },
			});
			check(pay, { "bt pay 200": (r) => r.status === 200 });
			const clr = http.del(URLS.cartClear, null, {
				...withToken(token),
				tags: { name: "cart_clear" },
			});
			check(clr, {
				"cart clear 2xx/204": (r) => r && ((r.status >= 200 && r.status < 300) || r.status === 204),
			});
		} else if (hasItems) {
			// Abandonment/cleanup
			branch_abandon.add(1);
			if (Math.random() < 0.6) {
				const rm = http.del(URLS.cartRemoveIndex(0), null, {
					...withToken(token),
					tags: { name: "cart_remove_0" },
				});
				check(rm, {
					"cart remove[0] 2xx/204": (r) =>
						r && ((r.status >= 200 && r.status < 300) || r.status === 204),
				});
			} else {
				const clr = http.del(URLS.cartClear, null, {
					...withToken(token),
					tags: { name: "cart_clear" },
				});
				check(clr, {
					"cart clear 2xx/204": (r) =>
						r && ((r.status >= 200 && r.status < 300) || r.status === 204),
				});
			}
		}

		sleepThink();
	});
}
