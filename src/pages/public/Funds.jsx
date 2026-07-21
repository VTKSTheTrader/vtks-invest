import SEO from "../../components/common/SEO";
import FundList from "../../components/funds/FundList";
import "./Funds.css";

export default function Funds() {
  return (
    <>
      <SEO
        title="VTKS Public Fund | Stock Portfolio & Investment Ideas"
        description="Explore the VTKS Public Fund featuring structured investment ideas, portfolio tracking, trade performance, and disciplined stock market analysis."
        keywords="VTKS Fund, public portfolio, investment ideas, stock portfolio, swing trading, technical analysis, portfolio tracking, Indian stock market"
      />

      <main className="funds-page">
        <section className="funds-hero">
          <div className="funds-hero-content">
            <span className="funds-hero-badge">
              📊 VTKS Public Portfolio
            </span>

            <h1>VTKS Public Fund</h1>

            <p>
              Explore publicly shared investment ideas powered by the VTKS
              framework. Premium subscriber trades remain exclusive to VTKS
              members.
            </p>
          </div>
        </section>

        <section className="funds-content">
          <FundList />
        </section>
      </main>
    </>
  );
}