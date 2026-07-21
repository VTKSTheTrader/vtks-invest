import "./ProductsSection.css";

const products = [
  {
    icon: "📊",
    title: "VTKS Fund",
    text: "Transparent model portfolio with entry, targets, stop loss and performance tracking.",
  },
  {
    icon: "📈",
    title: "VTKS Indicators",
    text: "Rule-based TradingView indicators built around structure, trend and zones.",
  },
  {
    icon: "🔍",
    title: "VTKS Scanner",
    text: "Find high-probability trading and investment opportunities faster.",
  },
  {
    icon: "🎓",
    title: "VTKS Academy",
    text: "Videos, PDFs, studies and Nifty Par Charcha recordings in one place.",
  },
];

export default function ProductsSection() {
  return (
    <section className="products-section">
      <div className="products-container">
        <span className="section-tag">🚀 VTKS Products</span>

        <h2>One Platform. Multiple VTKS Tools.</h2>

        <p>
          VTKS Hub brings portfolio, indicators, scanner, learning and community
          into one structured trading ecosystem.
        </p>

        <div className="products-grid">
          {products.map((item) => (
            <div className="product-card" key={item.title}>
              <div className="product-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}