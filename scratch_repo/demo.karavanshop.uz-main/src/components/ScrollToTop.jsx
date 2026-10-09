export default function ScrollToTop({ visible, onClick }) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 p-3 bg-[#065f46] hover:bg-[#044c38] text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center border border-emerald-400/30"
      title="Yuqoriga chiqish"
      aria-label="Yuqoriga chiqish"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}
