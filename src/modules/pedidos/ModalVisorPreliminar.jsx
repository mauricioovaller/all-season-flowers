// src/componentes/ModalPDF.js
import React from "react";

const ModalVisorPreliminar = ({ url, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-11/12 h-5/6 rounded-lg overflow-hidden relative">
        <div className="flex justify-end p-2 bg-gray-100">
          <button
            onClick={onClose}
            className="text-white bg-red-500 hover:bg-red-700 px-3 py-1 rounded"
          >
            Cerrar
          </button>
        </div>
        <iframe
          src={url}
          title="Vista de PDF"
          className="w-full h-full border-none"
        ></iframe>
      </div>
    </div>
  );
};

export default ModalVisorPreliminar;
