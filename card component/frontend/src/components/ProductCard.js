import React from 'react';
import './../App.css'; // Styling ke liye

function ProductCard({ name, price, description }) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p className="price">Price: ₹{price}</p>
      <p>{description}</p>
    </div>
  );
}

export default ProductCard;