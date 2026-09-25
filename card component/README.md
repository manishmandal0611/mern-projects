# Product Card Component - MERN CRUD App

A simple and responsive full-stack MERN application to manage products using complete CRUD operations. The project displays products in a clean card layout with options to create, read, update, and delete entries directly connected to MongoDB.

## Features

- **Product Listing:** Fetches and displays products in a responsive grid card layout.
- **Add Product:** Form validation to add new products with Name, Price, and Description.
- **Update Product:** Pre-fills product details into the form for easy editing.
- **Delete Product:** Removes selected product from the database via the card action button.
- **Clean UI:** Responsive design using plain CSS.

## Tech Stack

- **Frontend:** React.js, Axios, Plain CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)

## Project Structure

```text
card component/
├── backend/
│   ├── models/
│   │   └── Product.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ProductCard.jsx
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json