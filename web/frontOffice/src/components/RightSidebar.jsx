import React from "react";

const RightSidebar = () => {
  return (
    <aside
      className="bg-light border-start"
      style={{
        position: "fixed",
        top: "80px",
        right: "0",
        marginBottom: "0",
        width: "320px",
        height: "calc(100vh - 80px)",
        overflowY: "auto",
        zIndex: 1000,
        borderLeft: "2px solid #333",
      }}
    >
      <div className="p-3">
        <h6>Posts Recentes</h6>
        {/* Add logic to display recent posts */}
      </div>
    </aside>
  );
};

export default RightSidebar;
