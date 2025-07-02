import React from 'react';

const Index = () => {


  return (

    <div className="greeting-main-section-minimal d-flex align-items-center">
      <div className="container py-5"> 
        <div className="row justify-content-center text-center mb-5">
          <div className="col-md-10 col-lg-8">

            <h1 className={`h1 fw-bold `}>Vive como se fosses morrer amanhã.</h1>
            <h2 className={`h3 fw-semibold mt-3`}>Aprende como se fosses viver para sempre.</h2>
            <p className={`lead fst-italic mt-4`}>~ Mahatma Gandhi</p>

          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="ratio ratio-16x9 rounded-3 shadow-lg">

                 <iframe
                   src="https://www.youtube.com/embed/QXaiss8BwKo?autoplay=1&mute=1&loop=1&modestbranding=1&controls=0&showinfo=0"
                   title="Softinsa"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                 />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
