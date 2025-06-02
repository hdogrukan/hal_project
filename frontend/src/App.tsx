import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import ProductPage from "@/pages/ProductPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
    </Layout>
  );
}