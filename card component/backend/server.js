const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Product = require("./models/Product");

const app = express();

// =======================
// MIDDLEWARE
// =======================

app.use(cors());
app.use(express.json());

// =======================
// MONGODB CONNECTION
// =======================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });

// =======================
// TEST ROUTE
// =======================

app.get("/", (req, res) => {
  res.json({
    message: "Product API is running successfully!",
  });
});

// =======================
// GET - ALL PRODUCTS
// =======================

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 });

    res.status(200).json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// =======================
// POST - CREATE PRODUCT
// =======================

app.post("/api/products", async (req, res) => {
  try {
    const { name, price, description } = req.body;

    if (!name || price === undefined || price === "") {
      return res.status(400).json({
        message: "Product name and price are required",
      });
    }

    const newProduct = new Product({
      name,
      price: Number(price),
      description: description || "",
    });

    const savedProduct = await newProduct.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    res.status(400).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
});

// =======================
// PUT - UPDATE PRODUCT
// =======================

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;

    // Check MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (!name || price === undefined || price === "") {
      return res.status(400).json({
        message: "Product name and price are required",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price: Number(price),
        description: description || "",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    res.status(400).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
});

// =======================
// DELETE - DELETE PRODUCT
// =======================

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("DELETE REQUEST RECEIVED");
    console.log("Product ID:", id);

    // Check MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid Product ID:", id);

      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      console.error("Product not found:", id);

      return res.status(404).json({
        message: "Product not found",
      });
    }

    console.log("Product deleted successfully:", deletedProduct);

    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    res.status(500).json({
      message: "Failed to delete product",
      error: error.message,
    });
  }
});

// =======================
// 404 ROUTE
// =======================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// =======================
// START SERVER
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
