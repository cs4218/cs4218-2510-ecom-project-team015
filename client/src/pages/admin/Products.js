import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/AdminMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
const Products = () => {
	const [products, setProducts] = useState([]);

	//getall products
	const getAllProducts = async () => {
		try {
			const { data } = await axios.get("/api/v1/product/get-product");
			setProducts(data.products);
		} catch (error) {
			console.log(error);
			// Bug fix: Corrected the typo in "Someething" to "Something"
			toast.error("Something Went Wrong");
		}
	};

	//lifecycle method
	useEffect(() => {
		getAllProducts();
	}, []);
	return (
    // Bug Fix: Added Products Title
		<Layout title="Dashboard - Products">
			<div className="row">
				<div className="col-md-3">
					<AdminMenu />
				</div>

				<div className="col-md-9">
					<h1 className="text-center mb-4">All Products List</h1>

					{/* Bug Fix: Made it into responsive grid because it was overflowing */}
					<div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
						{products?.map((p) => (
							<div className="col" key={p._id}>
								<Link
									to={`/dashboard/admin/product/${p.slug}`}
									className="text-decoration-none text-reset d-block h-100"
								>
									<div className="card h-100 shadow-sm">
										<img
											src={`/api/v1/product/product-photo/${p._id}`}
											className="card-img-top"
											alt={p.name}
											style={{ height: 180, objectFit: "cover" }}
										/>
										<div className="card-body d-flex flex-column">
											<h5 className="card-title mb-2 text-truncate" title={p.name}>
												{p.name}
											</h5>
											<p
												className="card-text mb-3"
												style={{
													display: "-webkit-box",
													WebkitLineClamp: 2,
													WebkitBoxOrient: "vertical",
													overflow: "hidden",
												}}
												title={p.description}
											>
												{p.description}
											</p>

											{/* Bug Fix: Added Price and Edit button */}
											<div className="mt-auto d-flex justify-content-between align-items-center">
												<span className="fw-semibold" style={{ color: "#16a34a" }}>
													${p.price}
												</span>
												<span className="btn btn-sm btn-outline-primary">Edit</span>
											</div>
										</div>
									</div>
								</Link>
							</div>
						))}
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default Products;
