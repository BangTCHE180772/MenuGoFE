import { useState, useEffect, useMemo, useCallback } from "react";
import { Pagination } from "antd";
import {
  AppstoreOutlined,
  CoffeeOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { getMainChain } from "../api/chainApi";
import { getAllBranches } from "../api/branchApi";
import { getAllMenus, getProductsODataPaged } from "../api/menuApi";

import CustomerHeader from "../components/customer/CustomerHeader";
import CustomerHeroBanner from "../components/customer/CustomerHeroBanner";
import CustomerSearchBar from "../components/customer/CustomerSearchBar";
import CustomerMenuFilter from "../components/customer/CustomerMenuFilter";
import CustomerMenuSort from "../components/customer/CustomerMenuSort";
import CustomerMenuGrid from "../components/customer/CustomerMenuGrid";
import CustomerBranchSection from "../components/customer/CustomerBranchSection";
import CustomerFooter from "../components/customer/CustomerFooter";
import ProductDetailModal from "../components/customer/ProductDetailModal";
import ToTop from "../components/ToTop";

import "../styles/CustomerHomePage.css";

//=======================================================================================================================Fake Data
const MOCK_CHAIN = {
  id: 1,
  name: "Cửa hàng",
  logoImage:
    // "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
    "",
  backgroundImage:
    // "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    "",
  openTime: "08:00:00",
  closeTime: "22:30:00",
  newAddressName: "Địa chỉ",
};

const currentDate = new Date();
const currentMonthIsoString = currentDate.toISOString();

const MOCK_PRODUCTS = [
  {
    id: 101,
    name: "Tên món ăn mẫu (Mock)",
    price: 100000,
    imageLink:
      // "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      "",
    groupName: "Món ăn",
    description: "Mô tả.",
    createdAt: currentMonthIsoString,
    isNew: true,
  },
];

const MOCK_BRANCHES = [
  {
    id: 1,
    name: "nhánh mẫu ",
    newAddressName: "Địa chỉ ",
    openTime: "08:00",
    closeTime: "22:30",
    phone: "0123456789",
    isMain: true,
  },
];

//==========================================================================================================new menu item in month
const isCreatedInCurrentMonth = (dateStr) => {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
};

const CustomerHomePage = () => {
  const [chainInfo, setChainInfo] = useState(MOCK_CHAIN);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [menus, setMenus] = useState([]);

  const [, setLoadingChain] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("default");

  const [activeSection, setActiveSection] = useState("hero");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  //=================================================================================================================== Fetch Data
  const fetchChain = useCallback(async () => {
    setLoadingChain(true);
    try {
      const res = await getMainChain();
      console.log("getMainChain response:", res.data);
      if (res.data) {
        setChainInfo((prev) => ({
          ...prev,
          ...res.data,
          backgroundImage: res.data.backgroundImage || prev.backgroundImage,
          logoImage: res.data.logoImage || prev.logoImage,
        }));
      }
    } catch (err) {
      console.error("fetchChain error detailed:", err);
      console.warn("Dùng dữ liệu Chain mặc định:", err.message);
    } finally {
      setLoadingChain(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    setLoadingBranches(true);
    try {
      const res = await getAllBranches();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setBranches(res.data);
      }
    } catch (err) {
      console.warn("Dùng dữ liệu Branch mặc định:", err.message);
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  const fetchProducts = useCallback(
    async (searchText = "", catId = "all", pageIdx = 1, size = 8) => {
      setLoadingMenu(true);
      try {
        const data = await getProductsODataPaged({
          searchText,
          menuId: catId,
          pageSize: size,
          pageIndex: pageIdx,
        });

        const items = data.value || [];
        const total = data["@odata.count"] ?? items.length;

        setTotalCount(total);

        if (items.length > 0) {
          const formatted = items.map((p) => ({
            ...p,
            id: p.id || p.Id,
            name: p.name || p.Name,
            price: p.sellPrice ?? p.SellPrice ?? p.price ?? p.Price ?? 0,
            imageLink:
              p.imageLink ||
              p.ImageLink ||
              (p.Image && p.Image.ImageLink) ||
              p.image ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
            groupName:
              p.groupName ||
              p.GroupName ||
              p.Group?.Name ||
              p.category ||
              "Món ăn",
            isNew:
              p.isNew ??
              isCreatedInCurrentMonth(
                p.createdAt || p.CreatedAt || p.createdDate || p.CreatedDate,
              ),
          }));
          setProducts(formatted);
        } else {
          if (pageIdx === 1 && searchText === "" && catId === "all") {
            setProducts(MOCK_PRODUCTS);
            setTotalCount(MOCK_PRODUCTS.length);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.warn(
          "Gọi API OData paged lỗi, sử dụng dữ liệu món ăn mẫu:",
          err.message,
        );
        setProducts(MOCK_PRODUCTS);
        setTotalCount(MOCK_PRODUCTS.length);
      } finally {
        setLoadingMenu(false);
      }
    },
    [menus],
  );

  const fetchMenus = useCallback(async () => {
    try {
      const res = await getAllMenus();
      if (res.data && Array.isArray(res.data)) {
        setMenus(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn("Lỗi lấy danh mục menu:", err.message);
    }
    return [];
  }, []);

  useEffect(() => {
    const initData = async () => {
      fetchChain();
      fetchBranches();
      const currentMenus = await fetchMenus();
      fetchProducts(searchKeyword, selectedCategory, currentMenus, 1, 8);
    };

    initData();
  }, [fetchChain, fetchBranches]);

  //=================================================================================================================== filter data
  const handleSearchChange = (val) => {
    setSearchKeyword(val);
    setCurrentPage(1);
    fetchProducts(val, selectedCategory, menus, 1, pageSize);
  };

  const handleSearchClear = () => {
    setSearchKeyword("");
    setCurrentPage(1);
    fetchProducts("", selectedCategory, menus, 1, pageSize);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    fetchProducts(searchKeyword, catId, menus, 1, pageSize);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchProducts(searchKeyword, selectedCategory, menus, page, size);
  };

  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    const totalPages = Math.ceil(totalCount / pageSize);

    if (diff > 60) {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1, pageSize);
      }
    } else if (diff < -60) {
      if (currentPage > 1) {
        handlePageChange(currentPage - 1, pageSize);
      }
    }
  };

  const [mouseDownX, setMouseDownX] = useState(0);
  const [isMouseDownState, setIsMouseDownState] = useState(false);

  const handleMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    setIsMouseDownState(true);
    setMouseDownX(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (!isMouseDownState) return;
    setIsMouseDownState(false);
    const diff = mouseDownX - e.clientX;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (diff > 80) {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1, pageSize);
      }
    } else if (diff < -80) {
      if (currentPage > 1) {
        handlePageChange(currentPage - 1, pageSize);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsMouseDownState(false);
  };

  const filterCategories = useMemo(() => {
    const list = [{ id: "all", name: "Tất cả", icon: <AppstoreOutlined /> }];

    menus.forEach((m) => {
      list.push({
        id: String(m.id || m.Id),
        name: m.name || m.Name,
        icon: <CoffeeOutlined />,
      });
    });

    list.push({
      id: "new",
      name: "Món mới",
      icon: <CalendarOutlined />,
      isNew: true,
    });
    return list;
  }, [menus]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(q) ||
          (item.groupName || "").toLowerCase().includes(q),
      );
    }

    if (selectedCategory === "new") {
      result = result.filter(
        (item) =>
          item.isNew === true ||
          isCreatedInCurrentMonth(item.createdAt || item.CreatedAt),
      );
    }

    switch (sortOption) {
      case "price-asc":
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "name-asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name-desc":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      default:
        break;
    }

    return result;
  }, [products, searchKeyword, selectedCategory, sortOption]);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -70;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleOpenDetailModal = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="customer-home-layout">
      <CustomerHeader
        chainInfo={chainInfo}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <CustomerHeroBanner
        chainInfo={chainInfo}
        onExploreMenu={() => scrollToSection("menu")}
        onExploreBranches={() => scrollToSection("branches")}
      />

      <main id="menu" className="customer-menu-section">
        <div className="menu-container">
          <div className="menu-header-group">
            <span className="section-subtitle">Delicious Menu</span>
            <h2 className="section-title">Thực Đơn Đặc Sắc</h2>
            <div className="title-underline"></div>
          </div>

          <div className="menu-controls-bar">
            <CustomerSearchBar
              value={searchKeyword}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            />

            <CustomerMenuFilter
              categories={filterCategories}
              activeCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />

            <CustomerMenuSort
              value={sortOption}
              onChange={(val) => setSortOption(val)}
            />
          </div>

          <div
            className="menu-swiper-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: "grab" }}
          >
            {currentPage > 1 && (
              <button
                className="edge-nav-btn edge-left"
                onClick={() => handlePageChange(currentPage - 1, pageSize)}
                aria-label="Trang trước"
              >
                <LeftOutlined />
              </button>
            )}

            {currentPage < Math.ceil(totalCount / pageSize) && (
              <button
                className="edge-nav-btn edge-right"
                onClick={() => handlePageChange(currentPage + 1, pageSize)}
                aria-label="Trang sau"
              >
                <RightOutlined />
              </button>
            )}

            <CustomerMenuGrid
              products={filteredAndSortedProducts}
              loading={loadingMenu}
              onViewDetail={handleOpenDetailModal}
            />
          </div>

          {totalCount > 0 && (
            <div className="menu-pagination-wrapper">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalCount}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={["8", "20", "40", "100"]}
              />
            </div>
          )}
        </div>
      </main>

      <CustomerBranchSection
        branches={branches}
        loading={loadingBranches}
        chainInfo={chainInfo}
      />

      <CustomerFooter chainInfo={chainInfo} />

      <ProductDetailModal
        product={selectedProduct}
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      <ToTop />
    </div>
  );
};

export default CustomerHomePage;
