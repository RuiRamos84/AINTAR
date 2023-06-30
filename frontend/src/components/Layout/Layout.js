import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import animationData from "./OLas.json";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";

import "./Layout.css";

const Layout = ({ children }) => {
  const container = useRef(null);

  useEffect(() => {
    lottie.loadAnimation({
      container: container.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: animationData,
    });
  }, []);

  return (
    <>
      <div
        ref={container}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          zIndex: -1,
        }}
      />
      <Navbar />
      <main className="content container">{children}</main>
      <Footer />
    </>
  );
};

export default Layout;
