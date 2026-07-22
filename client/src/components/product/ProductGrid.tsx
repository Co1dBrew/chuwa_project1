// ProductGrid arranges product cards in a responsive grid (1/2/3/4 per row).

import { Col, Row } from "antd";
import type { Product } from "../../types/product";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onRequestDelete: (product: Product) => void;
}

function ProductGrid({ products, onRequestDelete }: ProductGridProps) {
  return (
    <Row gutter={[16, 16]}>
      {products.map(function (product) {
        return (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
            <ProductCard product={product} onRequestDelete={onRequestDelete} />
          </Col>
        );
      })}
    </Row>
  );
}

export default ProductGrid;
