import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CategoryForm from "../../components/Form/CategoryForm";
import { Modal } from "antd";
const CreateCategory = () => {
	const [categories, setCategories] = useState([]);
	const [name, setName] = useState("");
	const [visible, setVisible] = useState(false);
	const [selected, setSelected] = useState(null);
	const [updatedName, setUpdatedName] = useState("");

	// helpers
	const norm = (s = "") => s.trim().toLowerCase();
	const existsByName = (arr, nm) => arr.some((c) => norm(c.name) === norm(nm));

	//handle Form
	// Bug Fix: Corrected handleSubmit function to properly handle form submission and errors
	// such as when the name is blank or already exists
	const handleSubmit = async (e) => {
		e.preventDefault();

		const trimmed = name.trim();

		if (!trimmed) {
			toast.error("Name is required");
			return;
		}
		if (existsByName(categories, trimmed)) {
			toast.error("Category already exists");
			return;
		}

		try {
			const { data } = await axios.post("/api/v1/category/create-category", {
				name: trimmed,
			});
			if (data?.success) {
				toast.success(`${trimmed} is created`);
				setName(""); // Bug Fix: Clear the input field after successful creation
				getAllCategory();
			} else {
				toast.error(data.message || "Create failed");
			}
		} catch (error) {
			console.log(error);
			// Bug Fix: More specific error message
			if (error?.response?.status === 409) {
				toast.error("Category already exists");
			} else {
				toast.error("Something went wrong creating category");
			}
		}
	};

	//get all cat
	const getAllCategory = async () => {
		try {
			const { data } = await axios.get("/api/v1/category/get-category");
			if (data.success) {
				setCategories(data.category);
			}
		} catch (error) {
			console.log(error);
			// Bug Fix: Corrected spelling mistake in error message
			toast.error("Something went wrong in getting catgeory");
		}
	};

	useEffect(() => {
		getAllCategory();
	}, []);

	//update category
  // Bug Fix: Corrected handleUpdate function to properly handle update logic and errors
  // such as when the name is blank or already exists
	const handleUpdate = async (e) => {
		e.preventDefault();
		const trimmed = updatedName.trim();

		if (!trimmed) {
			toast.error("Name is required");
			return;
		}
		// exclude the row being edited by id
		const dup = categories.some((c) => c._id !== selected?._id && norm(c.name) === norm(trimmed));
		if (dup) {
			toast.error("Category already exists");
			return;
		}

		try {
			const { data } = await axios.put(`/api/v1/category/update-category/${selected._id}`, {
				name: trimmed,
			});
			if (data.success) {
				toast.success(`${trimmed} is updated`);
				setSelected(null);
				setUpdatedName("");
				setVisible(false);
				getAllCategory();
			} else {
				toast.error(data.message || "Update failed");
			}
		} catch (error) {
			// Bug Fix: Corrected spelling mistake in error message
			if (error?.response?.status === 409) {
				toast.error("Category already exists");
			} else {
				toast.error("Something went wrong updating category");
			}
		}
	};
	//delete category
	const handleDelete = async (pId) => {
		try {
			const { data } = await axios.delete(`/api/v1/category/delete-category/${pId}`);
			if (data.success) {
				// Bug Fix: Capitalized the first letter of the toast message
				toast.success(`Category is deleted`);

				getAllCategory();
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			// Bug Fix: Corrected spelling mistake in error message
			toast.error("Something went wrong");
		}
	};
	return (
		// Bug Fix: Corrected the title from "Dashboard - Create Category" to "Dashboard - Manage Category"
		<Layout title={"Dashboard - Manage Category"}>
			<div className="container-fluid m-3 p-3">
				<div className="row">
					<div className="col-md-3">
						<AdminMenu />
					</div>
					<div className="col-md-9">
						<h1>Manage Category</h1>
						<div className="p-3 w-50">
							<CategoryForm handleSubmit={handleSubmit} value={name} setValue={setName} />
						</div>
						<div className="w-75">
							<table className="table">
								<thead>
									<tr>
										<th scope="col">Name</th>
										<th scope="col">Actions</th>
									</tr>
								</thead>
								<tbody>
									{categories?.map((c) => (
										<>
											<tr>
												<td key={c._id}>{c.name}</td>
												<td>
													<button
														className="btn btn-primary ms-2"
														onClick={() => {
															setVisible(true);
															setUpdatedName(c.name);
															setSelected(c);
														}}
													>
														Edit
													</button>
													<button
														className="btn btn-danger ms-2"
														onClick={() => {
															handleDelete(c._id);
														}}
													>
														Delete
													</button>
												</td>
											</tr>
										</>
									))}
								</tbody>
							</table>
						</div>
						<Modal onCancel={() => setVisible(false)} footer={null} visible={visible}>
							<CategoryForm
								value={updatedName}
								setValue={setUpdatedName}
								handleSubmit={handleUpdate}
							/>
						</Modal>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default CreateCategory;
