import { Link } from "react-router-dom";


const Navbar = () =>{

  return (

    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">

      <a className="navbar-brand text-danger" href="/"> 
        TheSoftSkills 
      </a>

      <button 
        className="navbar-toggler" 
        type="button" 
        data-toggle="collapse" 
        data-target="#navbarSupportedContent" 
        aria-controls="navbarSupportedContent"
        aria-expanded="false" 
        aria-label="Toggle navigation"
      >
        <i className="ri-menu-line"/>
      </button>


    </nav>

  );

}


export default Navbar;
