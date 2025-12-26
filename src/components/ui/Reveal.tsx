"use client";

import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import { fadeUpSlow } from "@/lib/motion";

interface Props {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  className?: string;
  delay?: number;
  fullHeight?: boolean;
}

export const Reveal = ({ children, width = "100%", className = "", delay = 0, fullHeight = false }: Props) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  const mainControls = useAnimation();

  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
    }
  }, [isInView, mainControls]);

  return (
    <div ref={ref} style={{ position: "relative", width, height: fullHeight ? "100%" : "auto" }} className={className}>
      <motion.div
        variants={fadeUpSlow}
        initial="hidden"
        animate={mainControls}
        style={{ height: fullHeight ? "100%" : "auto" }}
        transition={{ duration: 1.0, delay: delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
