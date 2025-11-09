import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";

const Search = () => {
	const navigate = useNavigate();
	const [values, setValues] = useSearch();
	const [cart, setCart, cartActions] = useCart();
	return (
		<Layout title={"Search results"}>
			<div className="container">
				<div className="text-center">
					<h1>Search Results</h1>
					<h6>
						{values?.results.length < 1
							? "No Products Found"
							: `Found ${values?.results.length}`}
					</h6>
					<div className="d-flex flex-wrap mt-4">
						{values?.results.map((p) => (
							<div key={p._id} className="card m-2" style={{ width: "18rem" }}>
								<img
									src={`/api/v1/product/product-photo/${p._id}`}
									className="card-img-top"
									alt={p.name}
								/>
								<div className="card-body">
									<h5 className="card-title">{p.name}</h5>
									<p className="card-text">
										{p.description.substring(0, 30)}...
									</p>
									<p className="card-text"> $ {p.price}</p>
									<button
									className="btn btn-info ms-1"
									onClick={() => navigate(`/product/${p.slug}`)}
									>
									More Details
									</button>
									<button
										className="btn btn-dark ms-1"
										data-testid={`add-to-cart-${p.slug}`}
										onClick={() => {
										if (cartActions?.addToCart) {
											cartActions.addToCart(p);
										}
										}}
									>
									ADD TO CART
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default Search;
