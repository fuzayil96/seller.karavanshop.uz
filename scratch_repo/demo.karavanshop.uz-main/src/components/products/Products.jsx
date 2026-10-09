import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import getData from "../../utils/getData";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

const ITEMS_PER_BATCH = 24;

export default function Products({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // Qidiruv va asosiy filtrlar
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [imageFilter, setImageFilter] = useState("all"); // 'all' | 'with_image' | 'no_image'
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'in_stock' | 'out_of_stock'

  // Saralash (Sort)
  const [sortBy, setSortBy] = useState("default"); // 'default' | 'price_desc' | 'price_asc' | 'qty_desc' | 'qty_asc' | 'name_asc' | 'name_desc'

  // Kategoriya qidiruvli dropdown holati
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const categoryDropdownRef = useRef(null);

  // Tanlangan tovar modali
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Bosqichma-bosqich yuklash (Pagination / Infinite scroll)
  const [visibleLimit, setVisibleLimit] = useState(ITEMS_PER_BATCH);
  const observerTarget = useRef(null);

  // Dropdown tashqarisiga bosilganda yopish
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tovarlarni REGOS API dan yuklash
  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        let response;
        try {
          response = await getData({
            url: "/item/getExt",
            reqData: {
              image_size: "Large",
              // has_image: false,
            },
          });
        } catch {
          response = await getData({
            url: "/item/get",
            reqData: { deleted_mark: false },
          });
        }

        if (isMounted) {
          setProducts(response?.result || []);
        }
      } catch (err) {
        console.error("Tovarlarni yuklashda xatolik:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Kategoriyalar va har bir kategoriyadagi tovarlar soni
  const { categories, categoryCounts } = useMemo(() => {
    const counts = {};
    const list = [];

    products.forEach((p) => {
      const cat = p?.item?.group?.name || p?.group?.name;
      if (cat) {
        if (!counts[cat]) {
          counts[cat] = 0;
          list.push(cat);
        }
        counts[cat]++;
      }
    });

    list.sort((a, b) => a.localeCompare(b));
    return { categories: list, categoryCounts: counts };
  }, [products]);

  // Kategoriya dropdown ichidagi qidiruv
  const filteredCategories = useMemo(() => {
    const q = categorySearchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.toLowerCase().includes(q));
  }, [categories, categorySearchTerm]);

  // Rasmli va rasmsizlar soni
  const { withImageCount, withoutImageCount } = useMemo(() => {
    let withImg = 0;
    products.forEach((p) => {
      const img = p?.item?.image_url || p?.image_url;
      if (img) withImg++;
    });
    return {
      withImageCount: withImg,
      withoutImageCount: products.length - withImg,
    };
  }, [products]);

  // Omborda bor va tugaganlar soni
  const { inStockCount, outOfStockCount } = useMemo(() => {
    let inStk = 0;
    products.forEach((p) => {
      const qty = Number(p?.quantity?.common ?? p?.item?.quantity ?? 0);
      if (qty > 0) inStk++;
    });
    return {
      inStockCount: inStk,
      outOfStockCount: products.length - inStk,
    };
  }, [products]);

  // Qidiruv, toifa, rasm, qoldiq filtrlash va saralash (Sort)
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const list = products.filter((p) => {
      const item = p?.item || p;
      const name = (item?.name || "").toLowerCase();
      const itemCode = String(item?.code ?? "").toLowerCase();
      const articul = String(item?.articul ?? "").toLowerCase();
      const category = (item?.group?.name || "").toLowerCase();
      const hasImg = Boolean(item?.image_url || p?.image_url);
      const qty = Number(p?.quantity?.common ?? item?.quantity ?? 0);

      // Shtrix-kod bilan emas, nomi va kodi (yoki artikul) bilan qidirish
      const matchesSearch =
        !q ||
        name.includes(q) ||
        itemCode.includes(q) ||
        articul.includes(q);
      const matchesCategory =
        selectedCategory === "all" ||
        category === selectedCategory.toLowerCase();

      let matchesImage = true;
      if (imageFilter === "with_image") matchesImage = hasImg;
      if (imageFilter === "no_image") matchesImage = !hasImg;

      let matchesStock = true;
      if (stockFilter === "in_stock") matchesStock = qty > 0;
      if (stockFilter === "out_of_stock") matchesStock = qty <= 0;

      return matchesSearch && matchesCategory && matchesImage && matchesStock;
    });

    // Saralash (Sort)
    if (sortBy === "price_desc") {
      list.sort(
        (a, b) =>
          Number(b?.price || b?.item?.price || 0) -
          Number(a?.price || a?.item?.price || 0)
      );
    } else if (sortBy === "price_asc") {
      list.sort(
        (a, b) =>
          Number(a?.price || a?.item?.price || 0) -
          Number(b?.price || b?.item?.price || 0)
      );
    } else if (sortBy === "qty_desc") {
      list.sort(
        (a, b) =>
          Number(b?.quantity?.common ?? b?.item?.quantity ?? 0) -
          Number(a?.quantity?.common ?? a?.item?.quantity ?? 0)
      );
    } else if (sortBy === "qty_asc") {
      list.sort(
        (a, b) =>
          Number(a?.quantity?.common ?? a?.item?.quantity ?? 0) -
          Number(b?.quantity?.common ?? b?.item?.quantity ?? 0)
      );
    } else if (sortBy === "name_asc") {
      list.sort((a, b) =>
        (a?.item?.name || a?.name || "").localeCompare(
          b?.item?.name || b?.name || ""
        )
      );
    } else if (sortBy === "name_desc") {
      list.sort((a, b) =>
        (b?.item?.name || b?.name || "").localeCompare(
          a?.item?.name || a?.name || ""
        )
      );
    }

    return list;
  }, [products, searchTerm, selectedCategory, imageFilter, stockFilter, sortBy]);

  // Filtrlar o'zgarganda limitni boshiga qaytarish
  useEffect(() => {
    setVisibleLimit(ITEMS_PER_BATCH);
  }, [searchTerm, selectedCategory, imageFilter, stockFilter, sortBy]);

  // Ko'rsatiladigan qism (Slice)
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleLimit);
  }, [filteredProducts, visibleLimit]);

  const hasMore = visibleLimit < filteredProducts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleLimit((prev) => prev + ITEMS_PER_BATCH);
  }, []);

  // Infinite Scroll kuzatuvchisi
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, handleLoadMore]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Qadalib turuvchi Qidiruv, Dropdownlar va Filtrlar paneli */}
      <div
        style={{ position: "sticky", top: 0, zIndex: 20 }}
        className={`sticky top-0 z-20 pt-1 pb-2.5 -mt-1 transition-colors backdrop-blur-md ${
          isDarkMode ? "bg-[#02130e]/95" : "bg-[#f4f9f6]/95"
        }`}
      >
        <div
          className={`p-3.5 sm:p-5 rounded-2xl border transition-colors shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          {/* Sarlavha va soni */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Tovarlar Katalogi
            </h1>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? "text-emerald-200/70" : "text-slate-500"
              }`}
            >
              Jami: {products.length} ta • Topildi: {filteredProducts.length} ta • Ko'rsatilmoqda: {visibleProducts.length} ta
            </p>
          </div>

          {/* Qidiruv inputi */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Nomi yoki tovar kodi bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDarkMode
                    ? "bg-[#041f17] border border-[#0e4b39] text-white placeholder-emerald-200/40"
                    : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
                }`}
              />
              <svg
                className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                  isDarkMode ? "text-emerald-300/50" : "text-slate-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtrlar, Kategoriya Dropdown va Saralash (Sort) paneli */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2.5">
          {/* 1. Qidiruvli Kategoriya Dropdown (Select with search) */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition shadow-xs ${
                selectedCategory !== "all"
                  ? isDarkMode
                    ? "bg-[#065f46] text-white border-emerald-400"
                    : "bg-[#064e3b] text-white border-[#064e3b]"
                  : isDarkMode
                  ? "bg-[#072f23] text-emerald-100 border-[#0e4b39] hover:bg-[#0c3d2e]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>🏷️</span>
              <span className="max-w-[170px] truncate">
                {selectedCategory === "all"
                  ? "Kategoriya tanlash"
                  : selectedCategory}
              </span>
              <span className="text-[10px] opacity-70">
                {categoryDropdownOpen ? "▲" : "▼"}
              </span>
              {selectedCategory !== "all" && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory("all");
                  }}
                  className="ml-1 hover:text-rose-300 font-bold"
                  title="Tozalash"
                >
                  ✕
                </span>
              )}
            </button>

            {/* Qidiruvli Kategoriya Ro'yxati Dropdowni */}
            {categoryDropdownOpen && (
              <div
                className={`absolute left-0 top-full mt-1.5 w-72 max-h-80 z-50 rounded-2xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-md ${
                  isDarkMode
                    ? "bg-[#072f23] border-[#0e4b39] text-white"
                    : "bg-white border-emerald-100 text-slate-800"
                }`}
              >
                {/* Qidiruv inputi */}
                <div className="p-2.5 border-b border-inherit">
                  <input
                    type="text"
                    placeholder="Kategoriyani qidirish..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    autoFocus
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? "bg-[#041f17] border-[#0e4b39] text-white placeholder-emerald-200/40"
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                    }`}
                  />
                </div>

                {/* Kategoriyalar ro'yxati */}
                <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left font-semibold flex items-center justify-between transition ${
                      selectedCategory === "all"
                        ? isDarkMode
                          ? "bg-[#065f46] text-white"
                          : "bg-emerald-100 text-emerald-800"
                        : isDarkMode
                        ? "hover:bg-[#0c3d2e] text-emerald-100"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>Barcha kategoriyalar</span>
                    <span className="text-[11px] opacity-75">
                      ({products.length})
                    </span>
                  </button>

                  {filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left font-medium flex items-center justify-between transition ${
                        selectedCategory === cat
                          ? isDarkMode
                            ? "bg-[#065f46] text-white font-semibold"
                            : "bg-emerald-100 text-emerald-800 font-semibold"
                          : isDarkMode
                          ? "hover:bg-[#0c3d2e] text-emerald-100"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="truncate flex-1 mr-2">{cat}</span>
                      <span className="text-[11px] opacity-60 shrink-0">
                        ({categoryCounts[cat] || 0})
                      </span>
                    </button>
                  ))}

                  {filteredCategories.length === 0 && (
                    <div className="py-4 text-center opacity-60 text-xs">
                      Kategoriya topilmadi
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Saralash (Sort - Soni va Narxi bo'yicha) */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs ${
                sortBy !== "default"
                  ? isDarkMode
                    ? "bg-[#065f46] text-white border-emerald-400"
                    : "bg-[#064e3b] text-white border-[#064e3b]"
                  : isDarkMode
                  ? "bg-[#072f23] text-emerald-100 border-[#0e4b39] hover:bg-[#0c3d2e]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <option value="default">📊 Saralash: Odatiy</option>
              <option value="price_desc">💰 Narx: Qimmatdan arzonga (↓)</option>
              <option value="price_asc">💰 Narx: Arzondan qimmatga (↑)</option>
              <option value="qty_desc">📦 Soni: Ko'pdan kamga (↓)</option>
              <option value="qty_asc">📦 Soni: Kamdan ko'pga (↑)</option>
              <option value="name_asc">🔤 Nomi: A dan Z gacha</option>
              <option value="name_desc">🔤 Nomi: Z dan A gacha</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-2.5 text-[10px] opacity-60">
              ▼
            </div>
          </div>

          {/* 3. Omborda qoldiq filtri (Mavjud / Tugagan) */}
          <div className="relative">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs ${
                stockFilter !== "all"
                  ? isDarkMode
                    ? "bg-[#065f46] text-white border-emerald-400"
                    : "bg-[#064e3b] text-white border-[#064e3b]"
                  : isDarkMode
                  ? "bg-[#072f23] text-emerald-100 border-[#0e4b39] hover:bg-[#0c3d2e]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <option value="all">Qoldiq: Barchasi ({products.length})</option>
              <option value="in_stock">
                Faqat mavjudlar ({inStockCount})
              </option>
              <option value="out_of_stock">
                Tugaganlar ({outOfStockCount})
              </option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-2.5 text-[10px] opacity-60">
              ▼
            </div>
          </div>

          {/* 4. Rasm holati filtri */}
          <div className="relative">
            <select
              value={imageFilter}
              onChange={(e) => setImageFilter(e.target.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs ${
                imageFilter !== "all"
                  ? isDarkMode
                    ? "bg-[#065f46] text-white border-emerald-400"
                    : "bg-[#064e3b] text-white border-[#064e3b]"
                  : isDarkMode
                  ? "bg-[#072f23] text-emerald-100 border-[#0e4b39] hover:bg-[#0c3d2e]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <option value="all">Rasm: Barchasi ({products.length})</option>
              <option value="with_image">
                🖼️ Faqat rasmlilar ({withImageCount})
              </option>
              <option value="no_image">
                Rasmsizlar ({withoutImageCount})
              </option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-2.5 text-[10px] opacity-60">
              ▼
            </div>
          </div>

          {/* Filtrlarni tozalash tugmasi (agar qandaydir filtr faol bo'lsa) */}
          {(selectedCategory !== "all" ||
            stockFilter !== "all" ||
            imageFilter !== "all" ||
            sortBy !== "default" ||
            searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setStockFilter("all");
                setImageFilter("all");
                setSortBy("default");
                setSearchTerm("");
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-rose-500/20"
            >
              Filtrlarni tozalash ↺
            </button>
          )}
        </div>
      </div>

      {/* Tovarlar ro'yxati (Grid ko'rinishi) */}
      {loading ? (
        <div
          className={`p-16 text-center rounded-2xl border ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/70"
              : "bg-white border-emerald-100 text-slate-500"
          }`}
        >
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-sm">Tovarlar katalogi yuklanmoqda...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product?.item?.id || product?.id || Math.random()}
                product={product}
                onSelect={setSelectedProduct}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>

          {/* Infinite Scroll trigger target & "More" yuklash tugmasi */}
          <div
            ref={observerTarget}
            className="py-6 flex flex-col items-center justify-center space-y-3"
          >
            {hasMore ? (
              <button
                type="button"
                onClick={handleLoadMore}
                className={`px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border shadow-sm ${
                  isDarkMode
                    ? "bg-[#065f46] hover:bg-[#077254] text-white border-emerald-400/40"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                }`}
              >
                <span>
                  Yana 24 ta ko'rsatish (Qolgan:{" "}
                  {filteredProducts.length - visibleLimit} ta)
                </span>
                <span>↓</span>
              </button>
            ) : (
              <p className="text-xs opacity-50 py-2">
                Barcha {filteredProducts.length} ta tovar ko'rsatildi
              </p>
            )}
          </div>
        </>
      ) : (
        <div
          className={`p-16 text-center rounded-2xl border ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/50"
              : "bg-white border-slate-200 text-slate-400"
          }`}
        >
          <span className="text-3xl block mb-2">🔍</span>
          <p className="text-sm font-semibold">
            Qidiruv va filtrlar bo'yicha hech qanday tovar topilmadi
          </p>
        </div>
      )}

      {/* Tovar kartochkasi modal oynasi (Omborlar bo'yicha qoldiq bilan) */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
