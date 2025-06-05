import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";



const Index = () => {
   console.log("something"+import.meta.env.VITE_TEST); // Log the variable to the console
   return (
      <h1>
         {import.meta.env.VITE_TEST} {/* Display the variable */}
      </h1>
   );
}


export default Index;
