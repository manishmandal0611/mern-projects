import React from "react";
import "./../App.css";

function ProductCard({ id, name, price, description, onEdit, onDelete }) {
  return (
    <div className="card">
      <h3>{name}</h3>

      <p className="price">Price: ₹{price}</p>

      <p>{description}</p>

      <div className="card-buttons">
        <button
          className="edit-btn"
          onClick={() =>
            onEdit({
              _id: id,
              name,
              price,
              description,
            })
          }
        >
          Edit
        </button>

        <button className="delete-btn" onClick={() => onDelete(id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
