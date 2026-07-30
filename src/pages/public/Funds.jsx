import SEO from "../../components/common/SEO";
import FundList from "../../components/funds/FundList";
import "./Funds.css";

export default function Funds() {
  return (
    <>
      

      <main className="funds-page">
        <section className="funds-hero">
          <div className="funds-hero-content">
            <span className="funds-hero-badge">
              📊 VTKS Market Insights
            </span>

            <h1>VTKS Market Studies</h1>

            <p>
              Explore educational chart studies based on the VTKS framework. These examples are shared for learning purposes only and should not be considered investment advice.
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