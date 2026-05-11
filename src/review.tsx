import { createRoot } from "react-dom/client";
import { ReviewPage } from "./app/ReviewPage.tsx";
import "./styles/index.css";
createRoot(document.getElementById("review-root")!).render(<ReviewPage />);
