import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from '../../../shared/components/Footer';


const Index = () => {
   console.log("something"+import.meta.env.VITE_TEST); // Log the variable to the console
   return (
      <h1>
         {import.meta.env.VITE_TEST} {/* Display the variable */}
      </h1>
   );
}


export default Index;
