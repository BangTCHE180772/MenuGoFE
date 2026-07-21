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
import { getAllMenus, getMenuProducts, getProductsODataPaged } from "../api/menuApi";

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

// ─── Mock Fallback Data ──────────────────────────────────────────────────────
const MOCK_CHAIN = {
  id: 1,
  name: "Chuỗi Nhà Hàng MenuGo Premium",
  logoImage:
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80",
  backgroundImage:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
  openTime: "08:00:00",
  closeTime: "22:30:00",
  newAddressName:
    "123 Đường Lý Tự Trọng, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
};

const currentDate = new Date();
const currentMonthIsoString = currentDate.toISOString();

const MOCK_PRODUCTS = [
  {
    id: 101,
    name: "Bò Bit-Tết Thượng Hạng Sauce Nấm Truffle",
    price: 350000,
    imageLink:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    groupName: "Đồ ăn",
    description:
      "Thịt bò Wagyu nhập khẩu nướng xèo trên đá núi lửa, phủ xốt nấm Truffle đen đặc chế thơm lừng.",
    createdAt: currentMonthIsoString,
    isNew: true,
  },
  {
    id: 102,
    name: "Cơm Chiên Hải Sản Hoàng Gia",
    price: 185000,
    imageLink:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    groupName: "Đồ ăn",
    description:
      "Cơm chiên hạt ngọc tôm hùm, sò điệp Nhật Bản và trứng tôm ebiko giòn rụm.",
    createdAt: currentMonthIsoString,
    isNew: true,
  },
  {
    id: 103,
    name: "Lẩu Thái Hải Sản Chùa Vàng",
    price: 490000,
    imageLink:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    groupName: "Đồ ăn",
    description:
      "Nước dùng chua cay đậm vị Tomyum truyền thống kết hợp hải sản tươi sống đánh bắt trong ngày.",
    createdAt: "2025-10-15T10:00:00Z",
    isNew: false,
  },
  {
    id: 104,
    name: "Trà Trái Cây Nhiệt Đới Special",
    price: 65000,
    imageLink:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    groupName: "Đồ uống",
    description:
      "Trà ô long thanh mát kết hợp xoài chín, chanh dây và dâu tây tươi mọng nước.",
    createdAt: currentMonthIsoString,
    isNew: true,
  },
  {
    id: 105,
    name: "Matcha Latte Đậu Đỏ Kem Béo",
    price: 72000,
    imageLink:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
    groupName: "Đồ uống",
    description:
      "Bột Matcha nguyên chất Uji Nhật Bản pha chế cùng sữa tươi nguyên chất và lớp macchiato kem béo.",
    createdAt: "2025-11-01T10:00:00Z",
    isNew: false,
  },
  {
    id: 106,
    name: "Bánh Tiramisu Ý Truyền Thống",
    price: 95000,
    imageLink:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
    groupName: "Tráng miệng",
    description:
      "Lớp bánh Savoiardi thấm đẫm Espresso và rượu Kahlua quyện cùng kem Mascarpone mềm mịn.",
    createdAt: currentMonthIsoString,
    isNew: true,
  },
  {
    id: 107,
    name: "Cheesecake Chanh Dây Mát Lạnh",
    price: 85000,
    imageLink:
      "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
    groupName: "Tráng miệng",
    description:
      "Bánh phô mai nướng thơm béo phủ sốt chanh dây tươi chua ngọt hài hòa.",
    createdAt: "2025-08-20T10:00:00Z",
    isNew: false,
  },
  {
    id: 108,
    name: "Mì Ý Carbonara Sốt Kem Thịt Muối",
    price: 165000,
    imageLink:
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
    groupName: "Đồ ăn",
    description:
      "Sợi mì Spaghetti chuẩn Al Dente bọc sốt trứng lòng đỏ, phô mai Parmesan và bacon giòn.",
    createdAt: "2025-09-05T10:00:00Z",
    isNew: false,
  },
];

const MOCK_BRANCHES = [
  {
    id: 1,
    name: "MenuGo Bến Thành (Trụ sở chính)",
    newAddressName: "123 Đường Lý Tự Trọng, Phường Bến Thành, Quận 1, TP. HCM",
    openTime: "08:00",
    closeTime: "22:30",
    phone: "1900 6868",
    isMain: true,
  },
  {
    id: 2,
    name: "MenuGo Thảo Điền",
    newAddressName: "45 Đường Xuân Thủy, Phường Thảo Điền, TP. Thủ Đức",
    openTime: "09:00",
    closeTime: "22:00",
    phone: "028 3822 9999",
    isMain: false,
  },
  {
    id: 3,
    name: "MenuGo Cầu Giấy",
    newAddressName:
      "88 Đường Trần Thái Tông, Phường Dịch Vọng, Cầu Giấy, Hà Nội",
    openTime: "08:30",
    closeTime: "22:00",
    phone: "024 3988 7777",
    isMain: false,
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────
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
  // State variables
  const [chainInfo, setChainInfo] = useState(MOCK_CHAIN);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [menus, setMenus] = useState([]);

  const [loadingChain, setLoadingChain] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalCount, setTotalCount] = useState(0);

  // Filter & Search & Sort states
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("default");

  // Nav highlight & Modal states
  const [activeSection, setActiveSection] = useState("hero");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ─── Fetch Chain Data ─────────────────────────────────────────────────────
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

  // ─── Fetch Branches Data ──────────────────────────────────────────────────
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

  // ─── Fetch Products via OData with Pagination ──────────────────────────────
  const fetchProducts = useCallback(async (searchText = "", catId = "all", currentMenus = [], pageIdx = 1, size = 8) => {
    setLoadingMenu(true);
    try {
      // Gọi OData phân trang động
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
          imageLink: p.imageLink || p.ImageLink || (p.Image && p.Image.ImageLink) || p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
          groupName: p.groupName || p.GroupName || p.Group?.Name || p.category || "Món ăn",
          isNew:
            p.isNew ??
            isCreatedInCurrentMonth(
              p.createdAt || p.CreatedAt || p.createdDate || p.CreatedDate
            ),
        }));
        setProducts(formatted);
      } else {
        // Fallback sang dữ liệu mẫu ở trang 1 nếu DB trống trơn để trải nghiệm người dùng luôn tốt
        if (pageIdx === 1 && searchText === "" && catId === "all") {
          setProducts(MOCK_PRODUCTS);
          setTotalCount(MOCK_PRODUCTS.length);
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      console.warn("Gọi API OData paged lỗi, sử dụng dữ liệu món ăn mẫu:", err.message);
      setProducts(MOCK_PRODUCTS);
      setTotalCount(MOCK_PRODUCTS.length);
    } finally {
      setLoadingMenu(false);
    }
  }, [menus]);

  // ─── Fetch Menus ───────────────────────────────────────────────────────────
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

  // Load initial data
  useEffect(() => {
    const initData = async () => {
      fetchChain();
      fetchBranches();
      const currentMenus = await fetchMenus();
      // Load products với trang 1 và kích thước mặc định ban đầu là 8
      fetchProducts(searchKeyword, selectedCategory, currentMenus, 1, 8);
    };

    initData();
  }, [fetchChain, fetchBranches]);

  // Handle Search Input Change
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

  // Handle Category Filter Change
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    fetchProducts(searchKeyword, catId, menus, 1, pageSize);
  };

  // Handle Pagination changes
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
      // Swiped left -> Go to Next Page
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1, pageSize);
      }
    } else if (diff < -60) {
      // Swiped right -> Go to Prev Page
      if (currentPage > 1) {
        handlePageChange(currentPage - 1, pageSize);
      }
    }
  };

  // ─── Tạo danh sách Category Filter động từ Menus ───────────────────────────
  const filterCategories = useMemo(() => {
    const list = [{ id: "all", name: "Tất cả", icon: <AppstoreOutlined /> }];

    menus.forEach((m) => {
      list.push({
        id: String(m.id || m.Id),
        name: m.name || m.Name,
        icon: <CoffeeOutlined />,
      });
    });

    list.push({ id: "new", name: "Món mới", icon: <CalendarOutlined />, isNew: true });
    return list;
  }, [menus]);

  // ─── Client-Side Filter & Sort Processing ──────────────────────────────────
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Text Search Filter (realtime client side backup)
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(q) ||
          (item.groupName || "").toLowerCase().includes(q)
      );
    }

    // 2. Category Filter (Chỉ lọc phía client cho "Món mới", các Menu ID cụ thể đã được lọc qua API)
    if (selectedCategory === "new") {
      result = result.filter(
        (item) =>
          item.isNew === true ||
          isCreatedInCurrentMonth(item.createdAt || item.CreatedAt)
      );
    }

    // 3. Sorting
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

  // ─── Smooth Navigation Handlers ──────────────────────────────────────────
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -70; // Header offset
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // View detail modal handlers
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
      {/* Fixed Sticky Header */}
      <CustomerHeader
        chainInfo={chainInfo}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Hero Banner Section */}
      <CustomerHeroBanner
        chainInfo={chainInfo}
        onExploreMenu={() => scrollToSection("menu")}
        onExploreBranches={() => scrollToSection("branches")}
      />

      {/* Main Menu Section */}
      <main id="menu" className="customer-menu-section">
        <div className="menu-container">
          {/* Section Header Title */}
          <div className="menu-header-group">
            <span className="section-subtitle">Delicious Menu</span>
            <h2 className="section-title">Thực Đơn Đặc Sắc</h2>
            <div className="title-underline"></div>
          </div>

          {/* Controls Bar: Search, Category Filter, Sort Dropdown */}
          <div className="menu-controls-bar">
            {/* Realtime Search Bar */}
            <CustomerSearchBar
              value={searchKeyword}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            />

            {/* Category Filter Pills */}
            <CustomerMenuFilter
              categories={filterCategories}
              activeCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />

            {/* Sort Dropdown */}
            <CustomerMenuSort
              value={sortOption}
              onChange={(val) => setSortOption(val)}
            />
          </div>

          {/* Menu Food Grid Display với Vuốt/Bấm mép để sang trang */}
          <div
            className="menu-swiper-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Nút mép trái để sang trang trước */}
            {currentPage > 1 && (
              <button
                className="edge-nav-btn edge-left"
                onClick={() => handlePageChange(currentPage - 1, pageSize)}
                aria-label="Trang trước"
              >
                <LeftOutlined />
              </button>
            )}

            {/* Nút mép phải để sang trang sau */}
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

          {/* Điều khiển phân trang (Pagination) */}
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

      {/* Branch Section */}
      <CustomerBranchSection
        branches={branches}
        loading={loadingBranches}
        chainInfo={chainInfo}
      />

      {/* Extensible Footer */}
      <CustomerFooter chainInfo={chainInfo} />

      {/* Product Detail Modal Popup */}
      <ProductDetailModal
        product={selectedProduct}
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      {/* Button cuộn lên đầu trang */}
      <ToTop />
    </div>
  );
};

export default CustomerHomePage;
