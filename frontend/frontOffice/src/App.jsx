import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.jsx";

import Index from './views/index';


function App() {
  return (
    <>
      <Router>
        <div className="App">
          <Navbar/>
          <div className="container py-4">
            <div className="row">
              <Routes>

                <Route path="/" element={<Index />} />

              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </>
  )
}

export default App;
