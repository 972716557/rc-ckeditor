// CustomCardComponent.jsx
import React from "react";

const CustomCardComponent = ({ title }) => {
  return (
    <div
      style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}
    >
      <h3>{title}</h3>
      <p>这是一个自定义卡片组件。</p>
    </div>
  );
};

export default CustomCardComponent;
