import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate } from "react-router-dom";
const { Option } = Select;

const CreateProduct = () => {
	const navigate = useNavigate();
	const [categories, setCategories] = useState([]);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [price, setPrice] = useState("");
	const [category, setCategory] = useState("");
	const [quantity, setQuantity] = useState("");
	const [shipping, setShipping] = useState("");
	const [photo, setPhoto] = useState("");

	//get all category
	const getAllCategory = async () => {
		try {
			const { data } = await axios.get("/api/v1/category/get-category");
			if (data?.success) {
				setCategories(data?.category);
			}
		} catch (error) {
			console.log(error);
			// Bug fix: Corrected typo in error message from "wwent" to "went"
			// and "catgeory" to "category"
			toast.error("Something went wrong in getting category");
		}
	};

	useEffect(() => {
		getAllCategory();
	}, []);

	const MAX_PRICE = 1_000_000;
	const MAX_QTY = 100_000;
	const MAX_PHOTO_BYTES = 1_000_000;

	const isBlank = (s) => !String(s).trim();

	//create product function
	// Bug Fix: Added error validation check
	const handleCreate = async (e) => {
		e.preventDefault();

		const trimmedName = String(name).trim();
		const trimmedDesc = String(description).trim();
		const p = Number(price);
		const q = Number(quantity);

		try {
			if (isBlank(trimmedName)) {
				toast.error("Name is required");
				return;
			}
			if (isBlank(trimmedDesc)) {
				toast.error("Description is required");
				return;
			}
			if (isBlank(category)) {
				toast.error("Category is required");
				return;
			}
			if (price === "" || price == null || Number.isNaN(p)) {
				toast.error("Price is Required");
				return;
			}
			if (quantity === "" || quantity == null || Number.isNaN(q)) {
				toast.error("Quantity is Required");
				return;
			}
			if (!photo) {
				toast.error("Photo is required");
				return;
			}
			if (photo.size > MAX_PHOTO_BYTES) {
				toast.error("Photo must be ≤ 1MB");
				return;
			}

			if (p <= 0 || p > MAX_PRICE) {
				toast.error(`Price must be > 0 and ≤ ${MAX_PRICE}`);
				return;
			}
			if (!Number.isInteger(q) || q <= 0 || q > MAX_QTY) {
				toast.error(`Quantity must be an integer > 0 and ≤ ${MAX_QTY}`);
				return;
			}

			const productData = new FormData();
			productData.append("name", trimmedName);
			productData.append("description", trimmedDesc);
			productData.append("price", String(p));
			productData.append("quantity", String(q));
			productData.append("photo", photo);
			productData.append("category", category);

			// Bug Fix: Added await to ensure the promise is resolved before proceeding
			const { data } = await axios.post("/api/v1/product/create-product", productData);

			if (data?.success) {
				// Bug Fix: Corrected the logic to show success toast only on successful creation
				toast.success("Product Created Successfully");
				navigate("/dashboard/admin/products");
			} else {
				toast.error(data?.message || "Create failed");
			}
		} catch (error) {
			const msg =
				error?.response?.data?.error ||
				error?.response?.data?.message ||
				(error?.response?.status === 409 && "Product already exists") ||
				(error?.response?.status === 400 && "Invalid product data") ||
				"Something went wrong";

			console.log(error);
			toast.error(msg);
		}
	};

	return (
		<Layout title={"Dashboard - Create Product"}>
			<div className="container-fluid m-3 p-3">
				<div className="row">
					<div className="col-md-3">
						<AdminMenu />
					</div>
					<div className="col-md-9">
						<h1>Create Product</h1>
						<div className="m-1 w-75">
							{/* Bug fix: Added value prop to Select to make it a controlled component */}
							<Select
								bordered={false}
								placeholder="Select a category"
								size="large"
								showSearch
								className="form-select mb-3"
								onChange={(value) => {
									setCategory(value);
								}}
								value={category}
							>
								{categories?.map((c) => (
									<Option key={c._id} value={c._id}>
										{c.name}
									</Option>
								))}
							</Select>
							<div className="mb-3">
								<label className="btn btn-outline-secondary col-md-12">
									{photo ? photo.name : "Upload Photo"}
									<input
										type="file"
										name="photo"
										accept="image/*"
										onChange={(e) => setPhoto(e.target.files[0])}
										hidden
									/>
								</label>
							</div>
							<div className="mb-3">
								{photo && (
									<div className="text-center">
										<img
											src={URL.createObjectURL(photo)}
											alt="product_photo"
											height={"200px"}
											className="img img-responsive"
										/>
									</div>
								)}
							</div>
							<div className="mb-3">
								<input
									type="text"
									value={name}
									placeholder="Write a name"
									className="form-control"
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
							<div className="mb-3">
								<textarea
									type="text"
									value={description}
									placeholder="Write a description"
									className="form-control"
									onChange={(e) => setDescription(e.target.value)}
								/>
							</div>

							<div className="mb-3">
								<input
									type="number"
									value={price}
									placeholder="Write a price"
									className="form-control"
									onChange={(e) => setPrice(e.target.value)}
								/>
							</div>
							<div className="mb-3">
								<input
									type="number"
									value={quantity}
									placeholder="Write a quantity"
									className="form-control"
									onChange={(e) => setQuantity(e.target.value)}
								/>
							</div>
							<div className="mb-3">
								<Select
									bordered={false}
									placeholder="Select Shipping "
									size="large"
									showSearch
									className="form-select mb-3"
									onChange={(value) => {
										setShipping(value);
									}}
								>
									<Option value="1">Yes</Option>
									<Option value="0">No</Option>
								</Select>
							</div>
							<div className="mb-3">
								<button className="btn btn-primary" onClick={handleCreate}>
									CREATE PRODUCT
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default CreateProduct;
