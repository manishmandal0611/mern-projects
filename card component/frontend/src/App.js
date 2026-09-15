import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "./components/ProductCard";
import "./App.css";

const API_URL = "https://card-component-backend.onrender.com/api/products";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
  });

  // =========================
  // GET PRODUCTS
  // =========================

  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // =========================
  // FORM INPUT
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // =========================
  // ADD / UPDATE PRODUCT
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.price) {
      alert("Please enter product name and price.");
      return;
    }

    try {
      if (editingProduct) {
        const response = await axios.put(`${API_URL}/${editingProduct._id}`, {
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
        });

        setProducts((previousProducts) =>
          previousProducts.map((product) =>
            product._id === editingProduct._id ? response.data : product,
          ),
        );

        alert("Product updated successfully!");
      } else {
        const response = await axios.post(API_URL, {
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
        });

        setProducts((previousProducts) => [...previousProducts, response.data]);

        alert("Product added successfully!");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving product:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Something went wrong while saving the product.",
      );
    }
  };

  // =========================
  // EDIT PRODUCT
  // =========================

  const handleEdit = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name,
      price: product.price,
      description: product.description || "",
    });

    setShowForm(true);
  };

  // =========================
  // DELETE PRODUCT
  // =========================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      console.log("Deleting product ID:", id);
      console.log("Delete URL:", `${API_URL}/${id}`);

      const response = await axios.delete(`${API_URL}/${id}`);

      console.log("Delete response:", response.data);

      setProducts((previousProducts) =>
        previousProducts.filter((product) => product._id !== id),
      );

      alert("Product deleted successfully!");
    } catch (error) {
      console.error("DELETE ERROR:", error);
      console.error("DELETE RESPONSE:", error.response);
      console.error("DELETE STATUS:", error.response?.status);
      console.error("DELETE DATA:", error.response?.data);

      alert(
        `Delete failed!\n\nStatus: ${
          error.response?.status || "No response"
        }\nMessage: ${
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message
        }`,
      );
    }
  };

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      description: "",
    });

    setEditingProduct(null);
    setShowForm(false);
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="App">
      <h1>My MERN Store</h1>

      {!showForm && (
        <button className="add-product-btn" onClick={() => setShowForm(true)}>
          + Add Product
        </button>
      )}

      {showForm && (
        <form className="product-form" onSubmit={handleSubmit}>
          <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>

          <input
            type="text"
            name="name"
            placeholder="Product name"
            value={formData.name}
            onChange={handleChange}
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Product description"
            value={formData.description}
            onChange={handleChange}
          />

          <div className="form-buttons">
            <button type="submit">
              {editingProduct ? "Update Product" : "Add Product"}
            </button>

            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-list">
          {products.length === 0 ? (
            <p>No products found. Add your first product!</p>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                price={product.price}
                description={product.description}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
