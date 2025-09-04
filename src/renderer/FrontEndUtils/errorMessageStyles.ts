import { toast, ToastOptions } from "react-toastify";

export const commonToastOptions: ToastOptions = {
    position: "bottom-right",
    hideProgressBar: true,
    autoClose: 5000,
    icon: false,

    style: {
        width: "450px",
        whiteSpace: "pre-line",
        backgroundColor: "#8b7e71ff",
        color: "#f8f7f4ff",
        fontSize: "1.2rem",
        fontFamily: "sans-serif",
        textAlign: "center",
        borderRadius: "10px",
        padding: "1rem 2rem",
    },
};