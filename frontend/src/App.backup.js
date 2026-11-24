import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [message] = useState("Hello! The app is working!");

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body text-center">
              <h1 className="card-title text-primary">HealthSync Pro</h1>
              <p className="card-text">{message}</p>
              <p className="text-muted">If you see this, React is working correctly!</p>
              <button className="btn btn-primary">Test Button</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;