/*
 * ProductGrid arranges product cards in a responsive grid.
 *
 * We use Ant Design's Row and Col. The Col "span" values change with the screen
 * size so the layout is responsive:
 *   - xs (phones)  : span 24  -> 1 card per row  (24 / 24)
 *   - sm (tablets) : span 12  -> 2 cards per row (24 / 12)
 *   - md (laptops) : span 8   -> 3 cards per row (24 / 8)
 *   - lg (desktops): span 6   -> 4 cards per row (24 / 6)
 * (Ant Design divides every row into 24 equal columns.)
 */

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
