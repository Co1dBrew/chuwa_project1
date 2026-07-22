/*
 * ProductListPage: the main page that lists products.
 *
 * It brings several pieces together:
 *   - a search box and a category filter
 *   - a responsive grid of product cards
 *   - pagination
 *   - loading / empty / error states
 *   - an "Add product" button for admins
 *   - delete handling that keeps the pagination correct
 *
 * The product data is loaded from the product service (our mock backend). We
 * keep page-only state (search text, current page, etc.) in local useState,
 * NOT in Redux, because no other page needs it.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Pagination, Space, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { Product } from "../types/product";
import { deleteProduct, getProducts } from "../services/productService";
import { useAppSelector } from "../app/hooks";
import { selectIsAdmin } from "../features/auth/authSelectors";
import ProductGrid from "../components/product/ProductGrid";
import ProductSearchBar from "../components/product/ProductSearchBar";
import ProductFilters from "../components/product/ProductFilters";
import DeleteProductModal from "../components/product/DeleteProductModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import { PRODUCT_CATEGORIES } from "../mocks/products";

/*
 * How many products to show per page.
 * (This is the single value to change if you want, say, 6 per page instead.)
 */
const PRODUCTS_PER_PAGE = 8;

function ProductListPage() {
  const isAdmin = useAppSelector(selectIsAdmin);

  // ----- Data loaded from the service -----
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- The current query (search / category / page) -----
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  // Bumping this number forces the products to reload (used after a delete).
  const [refreshCounter, setRefreshCounter] = useState(0);

  // ----- Delete dialog state -----
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /*
   * Load the products whenever the query changes (or we ask for a refresh).
   * The inner async function is needed because a useEffect callback itself
   * cannot be marked "async".
   */
  useEffect(
    function () {
      let isCurrent = true; // guards against setting state after unmount

      async function loadProducts() {
        setLoading(true);
        setError(null);

        try {
          const result = await getProducts({
            search: search,
            category: category,
            page: page,
            pageSize: PRODUCTS_PER_PAGE,
          });

          if (isCurrent) {
            setProducts(result.items);
            setTotal(result.total);
          }
        } catch (caughtError) {
          if (isCurrent) {
            const messageText =
              caughtError instanceof Error
                ? caughtError.message
                : "Could not load products.";
            setError(messageText);
          }
        } finally {
          if (isCurrent) {
            setLoading(false);
          }
        }
      }

      loadProducts();

      // Cleanup: if the effect re-runs or the page unmounts, ignore old results.
      return function () {
        isCurrent = false;
      };
    },
    [search, category, page, refreshCounter],
  );

  // ----- Event handlers -----

  function handleSearch(term: string) {
    setSearch(term);
    setPage(1); // a new search should start from the first page
  }

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    setPage(1);
  }

  function handleRetry() {
    // Reload by bumping the refresh counter.
    setRefreshCounter(function (previous) {
      return previous + 1;
    });
  }

  function handleRequestDelete(product: Product) {
    setProductToDelete(product);
  }

  function handleCancelDelete() {
    setProductToDelete(null);
  }

  async function handleConfirmDelete() {
    if (productToDelete === null) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteProduct(productToDelete.id);
      message.success(productToDelete.name + " was deleted.");

      // Pagination fix: if we just deleted the last item on a page that is not
      // the first page, step back one page so we do not land on an empty page.
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        handleRetry();
      }
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error ? caughtError.message : "Delete failed.";
      message.error(messageText);
    } finally {
      setDeleteLoading(false);
      setProductToDelete(null);
    }
  }

  // ----- What to render in the main area -----
  function renderContent() {
    if (loading) {
      return <LoadingSpinner message="Loading products..." />;
    }

    if (error !== null) {
      return <ErrorMessage message={error} onRetry={handleRetry} />;
    }

    if (products.length === 0) {
      return <EmptyState message="No products match your search." />;
    }

    return (
      <>
        <ProductGrid products={products} onRequestDelete={handleRequestDelete} />

        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <Pagination
            current={page}
            total={total}
            pageSize={PRODUCTS_PER_PAGE}
            showSizeChanger={false}
            onChange={function (newPage) {
              setPage(newPage);
            }}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      {/* Top row: page title and (for admins) the Add product button. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Products</h1>
        {isAdmin ? (
          <Link to="/products/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Add product
            </Button>
          </Link>
        ) : null}
      </div>

      {/* Search + filter row. */}
      <Space wrap style={{ marginBottom: 24 }}>
        <ProductSearchBar initialValue={search} onSearch={handleSearch} />
        <ProductFilters
          categories={PRODUCT_CATEGORIES}
          value={category}
          onChange={handleCategoryChange}
        />
      </Space>

      {renderContent()}

      {/* The delete confirmation dialog (hidden until a product is chosen). */}
      <DeleteProductModal
        open={productToDelete !== null}
        product={productToDelete}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}

export default ProductListPage;
