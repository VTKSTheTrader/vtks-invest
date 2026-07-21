import {
  useEffect,
  useRef,
  useState,
} from "react";

import { searchInstruments } from "../../services/instrumentService";

import "./InstrumentSearch.css";

export default function InstrumentSearch({
  value = "",
  selectedInstrument = null,
  onChange,
  onSelect,
  disabled = false,
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [loading, setLoading] =
    useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    const cleaned = String(query || "").trim();

    if (
      cleaned.length < 2 ||
      selectedInstrument?.trading_symbol ===
        cleaned
    ) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");

          const rows =
            await searchInstruments(
              cleaned,
              20
            );

          setResults(rows);
          setOpen(true);
        } catch (searchError) {
          console.error(
            "Stock search error:",
            searchError
          );

          setResults([]);
          setOpen(true);
          setError(
            searchError.message ||
              "Unable to search stocks."
          );
        } finally {
          setLoading(false);
        }
      },
      350
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, selectedInstrument]);

  const handleInputChange = (event) => {
    const newValue = event.target.value;

    setQuery(newValue);
    setError("");

    onChange?.(newValue);
  };

  const handleSelect = (instrument) => {
    const symbol =
      instrument.trading_symbol || "";

    setQuery(symbol);
    setResults([]);
    setOpen(false);
    setError("");

    onSelect?.(instrument);
  };

  return (
    <div
      ref={wrapperRef}
      className="instrument-search"
    >
      <label className="instrument-search-label">
        Search Stock
        <span>*</span>
      </label>

      <input
        type="search"
        value={query}
        disabled={disabled}
        autoComplete="off"
        placeholder="Type CDSL, RELIANCE, TCS..."
        className="instrument-search-input"
        onFocus={() => {
          if (
            results.length > 0 ||
            error
          ) {
            setOpen(true);
          }
        }}
        onChange={handleInputChange}
      />

      {loading && (
        <span className="instrument-search-loading">
          Searching…
        </span>
      )}

      {open && (
        <div className="instrument-search-dropdown">
          {error ? (
            <div className="instrument-search-message instrument-search-error">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="instrument-search-message">
              {loading
                ? "Searching instruments..."
                : "No matching NSE/BSE equity found."}
            </div>
          ) : (
            results.map((instrument) => (
              <button
                key={`${instrument.exchange}-${instrument.security_id}`}
                type="button"
                className="instrument-search-result"
                onClick={() =>
                  handleSelect(instrument)
                }
              >
                <div className="instrument-result-main">
                  <strong>
                    {instrument.trading_symbol}
                  </strong>

                  <span
                    className={`instrument-exchange instrument-${String(
                      instrument.exchange
                    ).toLowerCase()}`}
                  >
                    {instrument.exchange}
                  </span>
                </div>

                <div className="instrument-result-name">
                  {instrument.symbol_name ||
                    instrument.custom_symbol ||
                    instrument.instrument_name ||
                    "Equity"}
                </div>

                <div className="instrument-result-meta">
                  <span>
                    Segment:{" "}
                    {instrument.dhan_segment ||
                      instrument.segment}
                  </span>

                  <span>
                    Series:{" "}
                    {instrument.series || "—"}
                  </span>

                  <span>
                    Security ID:{" "}
                    {instrument.security_id}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selectedInstrument?.security_id && (
        <div className="selected-instrument">
          <div>
            <strong>
              ✓{" "}
              {selectedInstrument.trading_symbol ||
                selectedInstrument.stock}
            </strong>

            <span>
              {selectedInstrument.exchange} •{" "}
              {selectedInstrument.dhan_segment ||
                selectedInstrument.segment}
            </span>
          </div>

          <small>
            Security ID:{" "}
            {selectedInstrument.security_id ||
              selectedInstrument.securityId}
          </small>
        </div>
      )}
    </div>
  );
}