import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
	const [auth] = useAuth();
	const [cart, setCart] = useCart();
	const [clientToken, setClientToken] = useState("");
	const [instance, setInstance] = useState(null);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// total price
	const totalPrice = () => {
		try {
			let total = 0;
			cart?.forEach((item) => {
				const price = Number(item?.price) || 0;
				const qty = Number(item?.quantity ?? 1);
				total += price * qty;
			});
			return total.toLocaleString("en-US", {
				style: "currency",
				currency: "USD",
			});
		} catch (error) {
			console.log(error);
			return "$0.00";
		}
	};

	// delete item
	const removeCartItem = (pid) => {
		try {
			const myCart = [...cart];
			const index = myCart.findIndex((item) => item._id === pid);
			if (index >= 0) {
				myCart.splice(index, 1);
				setCart(myCart);
				localStorage.setItem("cart", JSON.stringify(myCart));
			}
		} catch (error) {
			console.log(error);
		}
	};

	// get payment gateway token
	const getToken = async () => {
		try {
			const { data } = await axios.get("/api/v1/product/braintree/token");
			// backend can return { clientToken: "..." } or the whole object contains clientToken
			setClientToken(
				data?.clientToken || data?.clientToken?.clientToken || data
			);
		} catch (error) {
			console.log(error);
			toast.error("Cannot get payment token");
		}
	};

	useEffect(() => {
		getToken();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth?.token]);

	// handle payments
	const handlePayment = async () => {
		try {
			if (!auth?.token) {
				toast.error("Please login first");
				return;
			}
			if (!instance) {
				toast.error("Payment form is not ready");
				return;
			}
			setLoading(true);

			const { nonce } = await instance.requestPaymentMethod();
			const { data } = await axios.post("/api/v1/product/braintree/payment", {
				nonce,
				cart,
			});

			setLoading(false);

			if (data?.ok || data?.success) {
				localStorage.removeItem("cart");
				setCart([]);
				toast.success("Payment Completed Successfully ");
				navigate("/dashboard/user/orders");
			} else {
				toast.error(data?.message || "Payment failed");
			}
		} catch (error) {
			console.log(error);
			setLoading(false);
			toast.error(error?.response?.data?.message || "Payment error");
		}
	};

	return (
		<Layout>
			<div className="cart-page">
				<div className="row">
					<div className="col-md-12">
						<h1 className="text-center bg-light p-2 mb-1">
							{!auth?.user ? "Hello Guest" : `Hello ${auth?.user?.name || ""}`}
							<p className="text-center">
								{cart?.length
									? auth?.token
										? `You Have ${cart.length} items in your cart`
										: `You Have ${cart.length} items in your cart please login to checkout !`
									: "Your Cart Is Empty"}
							</p>
						</h1>
					</div>
				</div>

				<div className="container">
					<div className="row">
						<div className="col-md-7 p-0 m-0">
							{cart?.map((p) => (
								<div className="row card flex-row" key={p._id}>
									<div className="col-md-4">
										<img
											src={`/api/v1/product/product-photo/${p._id}`}
											className="card-img-top"
											alt={p.name}
											width="100%"
											height={"130px"}
										/>
									</div>
									<div className="col-md-4">
										<p>{p.name}</p>
										<p>{(p.description || "").substring(0, 30)}</p>
										<p>Price : {p.price}</p>
										{p?.quantity ? <p>Qty: {p.quantity}</p> : null}
									</div>
									<div className="col-md-4 cart-remove-btn">
										<button
											className="btn btn-danger"
											onClick={() => removeCartItem(p._id)}>
											Remove
										</button>
									</div>
								</div>
							))}
						</div>

						<div className="col-md-5 cart-summary">
							<h2>Cart Summary</h2>
							<p>Total | Checkout | Payment</p>
							<hr />
							<h4>Total : {totalPrice()}</h4>

							{auth?.user?.address ? (
								<div className="mb-3">
									<h4>Current Address</h4>
									<h5>{auth?.user?.address}</h5>
									<button
										className="btn btn-outline-warning"
										onClick={() => navigate("/dashboard/user/profile")}>
										Update Address
									</button>
								</div>
							) : (
								<div className="mb-3">
									{auth?.token ? (
										<button
											className="btn btn-outline-warning"
											onClick={() => navigate("/dashboard/user/profile")}>
											Update Address
										</button>
									) : (
										<button
											className="btn btn-outline-warning"
											onClick={() => navigate("/login", { state: "/cart" })}>
											Please Login to checkout
										</button>
									)}
								</div>
							)}

							<div className="mt-2">
								{!clientToken || !auth?.token || !cart?.length ? null : (
									<>
										<DropIn
											options={{
												authorization: clientToken,
												paypal: { flow: "vault" },
											}}
											onInstance={(inst) => setInstance(inst)}
										/>
										<button
											className="btn btn-primary"
											onClick={handlePayment}
											disabled={loading || !instance || !auth?.user?.address}>
											{loading ? "Processing ...." : "Make Payment"}
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default CartPage;
