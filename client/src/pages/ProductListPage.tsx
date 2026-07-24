// Lists products with search, category filter, and pagination.

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Pagination, Space, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { Product } from "../types/product";
import { deleteProduct, getProducts } from "../services/productService";
import { useAppSelector } from "../app/hooks";
import { selectIsMerchant } from "../features/auth/authSelectors";
import ProductGrid from "../components/product/ProductGrid";
import ProductSearchBar from "../components/product/ProductSearchBar";
import ProductFilters from "../components/product/ProductFilters";
import DeleteProductModal from "../components/product/DeleteProductModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import { getCategories } from "../services/categoryService";

const PRODUCTS_PER_PAGE = 8;

function ProductListPage() {
  const isMerchant = useAppSelector(selectIsMerchant);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search / category / page live in the URL query string, so the address bar
  // reflects the current page and the link is shareable and refresh-safe.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page")) || 1;

  // Category names for the filter dropdown, loaded once from the backend.
  const [categories, setCategories] = useState<string[]>([]);

  // Bumping this forces a reload (used after a delete).
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reload products whenever the query changes or we ask for a refresh.
  useEffect(
    function () {
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

          setProducts(result.items);
          setTotal(result.total);
        } catch (caughtError) {
          const messageText =
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load products.";
          setError(messageText);
        } finally {
          setLoading(false);
        }
      }

      loadProducts();
    },
    [search, category, page, refreshCounter],
  );

  // Load the category list once, for the filter dropdown.
  useEffect(function () {
    getCategories()
      .then(function (loaded) {
        setCategories(
          loaded.map(function (item) {
            return item.name;
          }),
        );
      })
      .catch(function () {
        // If categories fail to load, the filter just stays empty.
      });
  }, []);

  // Write the query params, omitting defaults so the URL stays clean
  // (no "?page=1", no empty search / category).
  function updateParams(changes: {
    search?: string;
    category?: string;
    page?: number;
  }) {
    const next = new URLSearchParams(searchParams);

    if ("search" in changes) {
      if (changes.search) {
        next.set("search", changes.search);
      } else {
        next.delete("search");
      }
    }
    if ("category" in changes) {
      if (changes.category) {
        next.set("category", changes.category);
      } else {
        next.delete("category");
      }
    }
    if ("page" in changes) {
      if (changes.page && changes.page > 1) {
        next.set("page", String(changes.page));
      } else {
        next.delete("page");
      }
    }

    setSearchParams(next);
  }

  function handleSearch(term: string) {
    updateParams({ search: term, page: 1 }); // a new search starts from page 1
  }

  function handleCategoryChange(newCategory: string) {
    updateParams({ category: newCategory, page: 1 });
  }

  function handleRetry() {
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

      // If we deleted the last item on a non-first page, step back one page.
      if (products.length === 1 && page > 1) {
        updateParams({ page: page - 1 });
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
              updateParams({ page: newPage });
            }}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      {/* Top row: page title and merchant add-product action. */}
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
        {isMerchant ? (
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
          categories={categories}
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
