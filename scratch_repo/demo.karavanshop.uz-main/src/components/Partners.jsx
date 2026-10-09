import { useEffect, useState, useMemo, useCallback } from "react";
import getData from "../utils/getData";
import { parsePartnerBalance } from "../utils/partnerBalance";
import Header from "./Header";
import PartnersTable from "./PartnersTable";
import PartnerModal from "./PartnerModal";
import ScrollToTop from "./ScrollToTop";

export default function Partners({
  isDarkMode: propDarkMode,
  toggleTheme: propToggleTheme,
}) {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);

  // Qidiruv va saralash
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // partnerbalance/get holatlari
  const [periodDays, setPeriodDays] = useState(30); // 30, 90, 365, 0 (barchasi)
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceData, setBalanceData] = useState(null);

  // partnerbalance/get kesh xotirasi (bir zumda ochish va ulashish uchun)
  const [balanceCache, setBalanceCache] = useState({});

  // Nusxa olinganlik holati
  const [copied, setCopied] = useState(false);

  // Yuqoriga ko'tarish (Scroll to top)
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Dark mode / Light mode (ichki yoki tashqi prop)
  const [internalDarkMode, setInternalDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return true; // Default to'q yashil (Darkgreen) rejim
    } catch {
      return true;
    }
  });

  const isDarkMode =
    propDarkMode !== undefined ? propDarkMode : internalDarkMode;

  const toggleTheme =
    propToggleTheme ||
    (() => {
      setInternalDarkMode((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch (err) {
          console.error("Theme saqlashda xato:", err);
        }
        return next;
      });
    });

  // Hamkorlar ro'yxatini yuklash (/partner/get)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const unixSeconds = Math.floor(Date.now() / 1000);
        const reqData = {
          url: "/partner/get",
          reqData: {
            end_date: unixSeconds,
            deleted_mark: false,
          },
        };
        const response = await getData(reqData);
        let results = response?.result || [];
        
        // Settings'dan ruxsat etilgan kategoriyalarni olish
        const { getSettings } = await import("../services/settingsService");
        const settings = getSettings();
        const allowedCats = settings.allowedPartnerCategories || [];
        
        if (allowedCats.length > 0) {
          // Hamkor ob'ektida 'category', 'group' yoki shunga o'xshash nom bilan kelsa:
          // (Mock/Haqiqiy API ga qarab maydon nomini o'zgartirish mumkin. Masalan p.group_name)
          results = results.filter(p => {
            const cat = p.category || p.group_name || p.group || "Boshqalar";
            return allowedCats.some(ac => cat.toLowerCase().includes(ac.toLowerCase()));
          });
        }
        
        setPartners(results);
      } catch (err) {
        console.error("Hamkorlarni yuklashda xatolik:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Scroll hodisasini kuzatish (Yuqoriga chiqish tugmasi uchun)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sahifani eng yuqoriga qaytarish
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // partnerbalance/get API dan ma'lumot olish
  // https://docs.regos.uz/en/api/references/partnerbalance/get
  const loadPartnerBalance = useCallback(async (partner, days = periodDays) => {
    if (!partner?.id) return;
    setBalanceLoading(true);
    setBalanceData(null);

    const unixNow = Math.floor(Date.now() / 1000);
    const startUnix = days > 0 ? unixNow - days * 86400 : 0;

    const filters = [
      { Field: "date", Operator: "LessOrEqual", Value: String(unixNow) },
      { Field: "partner_id", Operator: "Equal", Value: String(partner.id) },
    ];
    if (startUnix > 0) {
      filters.unshift({
        Field: "date",
        Operator: "GreaterOrEqual",
        Value: String(startUnix),
      });
    }

    const reqPayload = {
      start_date: startUnix,
      end_date: unixNow,
      partner_id: Number(partner.id),
      filters,
      grouping: true,
      include_balance_rows: true,
    };

    try {
      let response;
      try {
        response = await getData({
          url: "/partnerbalance/get",
          reqData: reqPayload,
        });
        if (response?.ok === false) {
          throw new Error(
            response?.result?.description || "API xatolik qaytardi"
          );
        }
      } catch {
        // Fallback without leading slash
        response = await getData({
          url: "partnerbalance/get",
          reqData: reqPayload,
        });
      }

      const rawResult = response?.result || response;
      const parsed = parsePartnerBalance(rawResult);
      setBalanceData(parsed);
      setBalanceCache((prev) => ({ ...prev, [partner.id]: parsed }));
    } catch (err) {
      console.error("partnerbalance/get olishda xatolik:", err);
      setBalanceData({
        currencies: [],
        operations: [],
        mainBalanceText: "Xatolik yuz berdi",
        error: true,
      });
    } finally {
      setBalanceLoading(false);
    }
  }, [periodDays]);

  // Popup ochish
  const handleOpenModal = (partner) => {
    setSelectedPartner(partner);
    setCopied(false);
    const cached = balanceCache[partner.id];
    if (cached) {
      setBalanceData(cached);
      setBalanceLoading(false);
    } else {
      loadPartnerBalance(partner, periodDays);
    }
  };

  // Popup yopish
  const handleCloseModal = () => {
    setSelectedPartner(null);
    setCopied(false);
  };

  // Davr o'zgarganda qayta yuklash
  const handleChangePeriod = (days) => {
    setPeriodDays(days);
    if (selectedPartner) {
      loadPartnerBalance(selectedPartner, days);
    }
  };

  // Hamkor nomi va balansini birga nusxalash
  const handleCopyInfo = () => {
    if (!selectedPartner) return;
    const balance =
      balanceData?.mainBalanceText ||
      (balanceLoading ? "Yuklanmoqda..." : "0 so'm");
    const textToCopy = `Hamkor: ${selectedPartner.name}\nBalans: ${balance}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Qidiruv va saralash
  const displayedPartners = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const list = partners.filter((p) => {
      const nameMatch = (p.name || "").toLowerCase().includes(query);
      const phoneStr = Array.isArray(p.phones)
        ? p.phones.join(" ")
        : String(p.phones || "");
      const phoneMatch = phoneStr.toLowerCase().includes(query);
      return nameMatch || phoneMatch;
    });

    list.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      return sortAsc
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return list;
  }, [partners, searchTerm, sortAsc]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
        {/* Qadalib turuvchi Qidiruv va Boshqaruv paneli */}
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortAsc={sortAsc}
          setSortAsc={setSortAsc}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          totalCount={partners.length}
        />

        {/* Hamkorlar jadvali */}
        <PartnersTable
          loading={loading}
          partners={displayedPartners}
          onSelectPartner={handleOpenModal}
          isDarkMode={isDarkMode}
        />

      {/* POPUP MODAL (partnerbalance/get integratsiyasi) */}
      <PartnerModal
        partner={selectedPartner}
        onClose={handleCloseModal}
        balanceData={balanceData}
        balanceLoading={balanceLoading}
        periodDays={periodDays}
        onChangePeriod={handleChangePeriod}
        onCopyInfo={handleCopyInfo}
        copied={copied}
        onRetry={() => loadPartnerBalance(selectedPartner, periodDays)}
        isDarkMode={isDarkMode}
      />

      {/* Yuqoriga ko'tarish tugmasi */}
      <ScrollToTop visible={showScrollTop} onClick={scrollToTop} />
    </div>
  );
}
