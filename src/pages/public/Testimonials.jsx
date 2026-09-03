import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabase";

import "./Testimonials.css";

const MESSAGE_PREVIEW_LENGTH = 360;
const TESTIMONIALS_PER_PAGE = 6;

export default function Testimonials() {
  const [
    testimonials,
    setTestimonials,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("All");

  const [
    expandedIds,
    setExpandedIds,
  ] = useState([]);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /* =====================================================
     LOAD
  ===================================================== */

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials =
    async () => {
      try {
        setLoading(true);

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "testimonials"
            )
            .select("*")
            .eq(
              "status",
              "approved"
            )
            .order(
              "featured",
              {
                ascending: false,
              }
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (error) {
          throw error;
        }

        setTestimonials(
          data || []
        );
      } catch (error) {
        console.error(
          "Failed to load testimonials:",
          error
        );

        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories =
    useMemo(() => {
      const uniqueCategories =
        testimonials
          .map(
            (item) =>
              item.category
          )
          .filter(Boolean);

      return [
        "All",
        ...new Set(
          uniqueCategories
        ),
      ];
    }, [testimonials]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredTestimonials =
    useMemo(() => {
      if (
        selectedCategory ===
        "All"
      ) {
        return testimonials;
      }

      return testimonials.filter(
        (item) =>
          item.category ===
          selectedCategory
      );
    }, [
      selectedCategory,
      testimonials,
    ]);

  /* =====================================================
     FEATURED
  ===================================================== */

  const featuredTestimonials =
    useMemo(
      () =>
        testimonials
          .filter(
            (item) =>
              item.featured
          )
          .slice(0, 3),
      [testimonials]
    );

  /* =====================================================
     STATS
  ===================================================== */

  const averageRating =
    useMemo(() => {
      if (
        !testimonials.length
      ) {
        return 0;
      }

      const total =
        testimonials.reduce(
          (sum, item) =>
            sum +
            Number(
              item.rating || 0
            ),
          0
        );

      return (
        total /
        testimonials.length
      );
    }, [testimonials]);

  const verifiedCount =
    useMemo(
      () =>
        testimonials.filter(
          (item) =>
            item.verified_member
        ).length,
      [testimonials]
    );

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredTestimonials.length /
          TESTIMONIALS_PER_PAGE
      )
    );

  const paginatedTestimonials =
    useMemo(() => {
      const start =
        (
          currentPage - 1
        ) *
        TESTIMONIALS_PER_PAGE;

      return filteredTestimonials.slice(
        start,
        start +
          TESTIMONIALS_PER_PAGE
      );
    }, [
      filteredTestimonials,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedIds([]);
  }, [
    selectedCategory,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const firstRecord =
    filteredTestimonials.length ===
    0
      ? 0
      : (
          currentPage -
          1
        ) *
          TESTIMONIALS_PER_PAGE +
        1;

  const lastRecord =
    Math.min(
      currentPage *
        TESTIMONIALS_PER_PAGE,
      filteredTestimonials.length
    );

  /* =====================================================
     STARS
  ===================================================== */

  const renderStars = (
    rating
  ) => {
    const safeRating =
      Math.max(
        0,
        Math.min(
          5,
          Number(
            rating || 0
          )
        )
      );

    return Array.from(
      {
        length: 5,
      },
      (_, index) => (
        <span
          key={index}
          className={
            index <
            safeRating
              ? "testimonial-star testimonial-star-filled"
              : "testimonial-star"
          }
        >
          ★
        </span>
      )
    );
  };

  /* =====================================================
     DISPLAY HELPERS
  ===================================================== */

  const getDisplayName = (
    testimonial
  ) => {
    if (
      testimonial.show_name ===
      false
    ) {
      return "VTKS Member";
    }

    return (
      testimonial.name ||
      "VTKS Member"
    );
  };

  const getInitial = (
    testimonial
  ) =>
    getDisplayName(
      testimonial
    )
      .trim()
      .charAt(0)
      .toUpperCase();

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     EXPAND / COLLAPSE
  ===================================================== */

  const isExpanded = (
    testimonialId
  ) =>
    expandedIds.includes(
      testimonialId
    );

  const toggleExpanded = (
    testimonialId
  ) => {
    setExpandedIds(
      (previous) =>
        previous.includes(
          testimonialId
        )
          ? previous.filter(
              (id) =>
                id !==
                testimonialId
            )
          : [
              ...previous,
              testimonialId,
            ]
    );
  };

  /* =====================================================
     CARD
  ===================================================== */

  const TestimonialCard = ({
    testimonial,
    featured = false,
  }) => {
    const expanded =
      isExpanded(
        testimonial.id
      );

    const message =
      String(
        testimonial.message ||
          ""
      ).trim();

    const hasLongMessage =
      message.length >
      MESSAGE_PREVIEW_LENGTH;

    return (
      <article
        className={
          featured
            ? "testimonial-card testimonial-card-featured"
            : "testimonial-card"
        }
      >
        {/* FEATURED */}

        {featured && (
          <span className="testimonial-featured-badge">
            ★ Featured
          </span>
        )}

        {/* PERSON */}

        <div className="testimonial-card-header">

          <div className="testimonial-avatar">

            {testimonial.show_photo &&
            testimonial.photo_url ? (
              <img
                src={
                  testimonial.photo_url
                }
                alt={
                  getDisplayName(
                    testimonial
                  )
                }
              />
            ) : (
              <span>
                {getInitial(
                  testimonial
                )}
              </span>
            )}

          </div>

          <div className="testimonial-person">

            <div className="testimonial-name-row">

              <h3>
                {getDisplayName(
                  testimonial
                )}
              </h3>

              {testimonial.verified_member && (
                <span className="verified-member-badge">
                  ✓ Verified
                </span>
              )}

            </div>

            <p>
              {testimonial.category ||
                "VTKS Experience"}
            </p>

          </div>

        </div>

        {/* RATING */}

        <div
          className="testimonial-rating"
          aria-label={`${testimonial.rating || 0} out of 5 stars`}
        >
          {renderStars(
            testimonial.rating
          )}
        </div>

        {/* MESSAGE */}

        <div className="testimonial-message-area">

          <span
            className="testimonial-quote-mark"
            aria-hidden="true"
          >
            “
          </span>

          <blockquote
            className={
              expanded
                ? "testimonial-message expanded"
                : "testimonial-message collapsed"
            }
          >
            {message}
          </blockquote>

        </div>

        {/* READ MORE */}

        {hasLongMessage && (
          <button
            type="button"
            className="testimonial-read-more"
            onClick={() =>
              toggleExpanded(
                testimonial.id
              )
            }
          >
            {expanded
              ? "Show Less ↑"
              : "Read Full Experience →"}
          </button>
        )}

        {/* FOOTER */}

        <div className="testimonial-card-footer">

          <span>
            {testimonial.member_since
              ? `Member since ${testimonial.member_since}`
              : "VTKS Community"}
          </span>

          <span>
            {formatDate(
              testimonial.created_at
            )}
          </span>

        </div>

      </article>
    );
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="testimonials-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="testimonials-hero">

        <div className="testimonials-hero-content">

          <span className="testimonials-eyebrow">
            VTKS Community Experiences
          </span>

          <h1>
            What Our Members Say
          </h1>

          <p className="testimonials-hero-description">
            Genuine experiences shared
            by members learning structured
            market analysis, risk
            management and disciplined
            investing with VTKS.
          </p>

          <div className="testimonials-summary">

            <div className="testimonial-summary-card">

              <strong>
                {averageRating
                  ? averageRating.toFixed(
                      1
                    )
                  : "—"}
              </strong>

              <div className="summary-stars">
                {renderStars(
                  Math.round(
                    averageRating
                  )
                )}
              </div>

              <span>
                Average Rating
              </span>

            </div>

            <div className="testimonial-summary-card">

              <strong>
                {
                  testimonials.length
                }
              </strong>

              <span>
                Member Experiences
              </span>

            </div>

            <div className="testimonial-summary-card">

              <strong>
                {verifiedCount}
              </strong>

              <span>
                Verified Members
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="testimonials-content">

        {loading ? (
          <div className="testimonials-state">

            <div className="testimonial-loader" />

            <p>
              Loading member experiences...
            </p>

          </div>
        ) : testimonials.length ===
          0 ? (
          <div className="testimonials-empty">

            <h2>
              No testimonials published yet
            </h2>

            <p>
              Approved feedback from VTKS
              members will appear here.
            </p>

          </div>
        ) : (
          <>

            {/* =============================================
                FEATURED
            ============================================= */}

            {featuredTestimonials.length >
              0 && (
              <section className="featured-testimonials-section">

                <div className="testimonials-section-heading">

                  <span>
                    MEMBER HIGHLIGHTS
                  </span>

                  <h2>
                    Featured Experiences
                  </h2>

                  <p>
                    Selected feedback from
                    members of the VTKS
                    community.
                  </p>

                </div>

                <div className="testimonials-grid featured-grid">

                  {featuredTestimonials.map(
                    (
                      testimonial
                    ) => (
                      <TestimonialCard
                        key={
                          testimonial.id
                        }
                        testimonial={
                          testimonial
                        }
                        featured
                      />
                    )
                  )}

                </div>

              </section>
            )}

            {/* =============================================
                ALL TESTIMONIALS
            ============================================= */}

            <section className="all-testimonials-section">

              <div className="testimonials-section-heading">

                <span>
                  COMMUNITY FEEDBACK
                </span>

                <h2>
                  All Member Experiences
                </h2>

                <p>
                  Browse genuine experiences
                  shared by the VTKS
                  community.
                </p>

              </div>

              {/* FILTERS */}

              <div className="testimonial-filters">

                {categories.map(
                  (category) => (
                    <button
                      key={
                        category
                      }
                      type="button"
                      className={
                        selectedCategory ===
                        category
                          ? "testimonial-filter active"
                          : "testimonial-filter"
                      }
                      onClick={() =>
                        setSelectedCategory(
                          category
                        )
                      }
                    >
                      {category}
                    </button>
                  )
                )}

              </div>

              {/* RESULT SUMMARY */}

              <div className="testimonial-results-summary">

                <span>
                  Showing{" "}
                  <strong>
                    {firstRecord}
                  </strong>
                  {" – "}
                  <strong>
                    {lastRecord}
                  </strong>
                  {" of "}
                  <strong>
                    {
                      filteredTestimonials.length
                    }
                  </strong>
                  {" experiences"}
                </span>

                <span>
                  Page{" "}
                  <strong>
                    {currentPage}
                  </strong>
                  {" of "}
                  <strong>
                    {totalPages}
                  </strong>
                </span>

              </div>

              {/* GRID */}

              {paginatedTestimonials.length >
              0 ? (
                <div className="testimonials-grid">

                  {paginatedTestimonials.map(
                    (
                      testimonial
                    ) => (
                      <TestimonialCard
                        key={
                          testimonial.id
                        }
                        testimonial={
                          testimonial
                        }
                      />
                    )
                  )}

                </div>
              ) : (
                <div className="testimonials-empty">

                  <h3>
                    No feedback in this category
                  </h3>

                  <p>
                    Choose another category
                    to continue.
                  </p>

                </div>
              )}

              {/* PAGINATION */}

              {filteredTestimonials.length >
                TESTIMONIALS_PER_PAGE && (
                <div className="testimonial-pagination">

                  <button
                    type="button"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(
                            1,
                            page - 1
                          )
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <span>
                    Page{" "}
                    <strong>
                      {currentPage}
                    </strong>
                    {" of "}
                    <strong>
                      {totalPages}
                    </strong>
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                      )
                    }
                  >
                    Next →
                  </button>

                </div>
              )}

            </section>

          </>
        )}

        {/* =================================================
            CTA
        ================================================= */}

        <section className="testimonial-cta">

          <div>

            <span>
              ARE YOU A VTKS SUBSCRIBER?
            </span>

            <h2>
              Share Your Learning Experience
            </h2>

            <p>
              Submit your genuine feedback
              from the subscriber dashboard.
              Every submission is reviewed
              before publication.
            </p>

          </div>

          <Link to="/subscriber/feedback">
            Share Feedback →
          </Link>

        </section>

        {/* =================================================
            DISCLAIMER
        ================================================= */}

        <section className="testimonial-disclaimer">

          <div className="testimonial-disclaimer-icon">
            i
          </div>

          <div>

            <strong>
              Important Disclosure
            </strong>

            <p>
              Testimonials represent
              individual user experiences
              and do not guarantee similar
              results. Trading and investing
              involve market risk. VTKS
              provides educational tools,
              structured learning and market
              analysis frameworks, not
              assured returns.
            </p>

          </div>

        </section>

      </section>

    </main>
  );
}