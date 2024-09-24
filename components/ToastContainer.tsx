import React from "react";
import { Slide, ToastContainer as ReactToastifyContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

export function ToastContainer() {
  return (
    <ReactToastifyContainer
      position="bottom-right"
      hideProgressBar
      bodyClassName="p-0 pl-1"
      toastClassName="bg-accent text-ondark font-semibold min-h-0 gap-x-2 shadow-lg"
      transition={Slide}
    />
  );
}
