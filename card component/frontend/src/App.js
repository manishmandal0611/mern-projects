import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from './components/ProductCard';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend se data fetch karna
  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then((response) => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <h1>My MERN Store</h1>
      
      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-list">
          {products.length === 0 ? (
            <p>No products found. Add some from the backend!</p>
          ) : (
            products.map((product) => (
              <ProductCard 
                key={product._id} 
                name={product.name} 
                price={product.price} 
                description={product.description} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;