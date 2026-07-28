import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./Testimonials.css";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setTestimonials(data || []);
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const uniqueCategories = testimonials
      .map((item) => item.category)
      .filter(Boolean);

    return ["All", ...new Set(uniqueCategories)];
  }, [testimonials]);

  const filteredTestimonials = useMemo(() => {
    if (selectedCategory === "All") {
      return testimonials;
    }

    return testimonials.filter(
      (item) => item.category === selectedCategory
    );
  }, [selectedCategory, testimonials]);

  const featuredTestimonials = useMemo(
    () => testimonials.filter((item) => item.featured).slice(0, 3),
    [testimonials]
  );

  const averageRating = useMemo(() => {
    if (!testimonials.length) {
      return 0;
    }

    const total = testimonials.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );

    return total / testimonials.length;
  }, [testimonials]);

  const renderStars = (rating) => {
    const safeRating = Math.max(
      0,
      Math.min(5, Number(rating || 0))
    );

    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={
          index < safeRating
            ? "testimonial-star testimonial-star-filled"
            : "testimonial-star"
        }
      >
        ★
      </span>
    ));
  };

  const getDisplayName = (testimonial) => {
    if (testimonial.show_name === false) {
      return "VTKS Member";
    }

    return testimonial.name || "VTKS Member";
  };

  const getInitial = (testimonial) => {
    return getDisplayName(testimonial)
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const TestimonialCard = ({ testimonial, featured = false }) => (
    <article
      className={
        featured
          ? "testimonial-card testimonial-card-featured"
          : "testimonial-card"
      }
    >
      {featured && (
        <span className="testimonial-featured-badge">
          Featured
        </span>
      )}

      <div className="testimonial-card-header">
        <div className="testimonial-avatar">
          {testimonial.show_photo && testimonial.photo_url ? (
            <img
              src={testimonial.photo_url}
              alt={getDisplayName(testimonial)}
            />
          ) : (
            <span>{getInitial(testimonial)}</span>
          )}
        </div>

        <div className="testimonial-person">
          <div className="testimonial-name-row">
            <h3>{getDisplayName(testimonial)}</h3>

            {testimonial.verified_member && (
              <span className="verified-member-badge">
                Verified Member
              </span>
            )}
          </div>

          <p>
            {testimonial.category || "VTKS Experience"}
          </p>
        </div>
      </div>

      <div
        className="testimonial-rating"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {renderStars(testimonial.rating)}
      </div>

      <blockquote>
        “{testimonial.message}”
      </blockquote>

      <div className="testimonial-card-footer">
        {testimonial.member_since && (
          <span>
            Member since {testimonial.member_since}
          </span>
        )}

        <span>{formatDate(testimonial.created_at)}</span>
      </div>
    </article>
  );

  return (
    <main className="testimonials-page">
      <section className="testimonials-hero">
        <div className="testimonials-hero-content">
          <span className="testimonials-eyebrow">
            VTKS Community Experiences
          </span>

          <h1>What Our Members Say</h1>

          <p>
            Genuine feedback from members learning structured
            trading, technical analysis, risk management and
            disciplined investing with VTKS.
          </p>

          <div className="testimonials-summary">
            <div>
              <strong>
                {averageRating
                  ? averageRating.toFixed(1)
                  : "—"}
              </strong>

              <div className="summary-stars">
                {renderStars(Math.round(averageRating))}
              </div>

              <span>Average rating</span>
            </div>

            <div>
              <strong>{testimonials.length}</strong>
              <span>Approved experiences</span>
            </div>

            <div>
              <strong>
                {
                  testimonials.filter(
                    (item) => item.verified_member
                  ).length
                }
              </strong>
              <span>Verified members</span>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-content">
        {loading ? (
          <div className="testimonials-state">
            <div className="testimonial-loader" />
            <p>Loading member experiences...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="testimonials-empty">
            <h2>No testimonials published yet</h2>

            <p>
              Approved feedback from VTKS members will appear
              here.
            </p>
          </div>
        ) : (
          <>
            {featuredTestimonials.length > 0 && (
              <section className="featured-testimonials-section">
                <div className="testimonials-section-heading">
                  <span>Member Highlights</span>
                  <h2>Featured Experiences</h2>
                  <p>
                    Selected feedback from verified and active
                    members of the VTKS community.
                  </p>
                </div>

                <div className="testimonials-grid featured-grid">
                  {featuredTestimonials.map((testimonial) => (
                    <TestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                      featured
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="all-testimonials-section">
              <div className="testimonials-section-heading">
                <span>Community Feedback</span>
                <h2>All Member Experiences</h2>
              </div>

              <div className="testimonial-filters">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory === category
                        ? "testimonial-filter active"
                        : "testimonial-filter"
                    }
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                  >
                    {category}
                  </button>
                ))}
              </div>

              {filteredTestimonials.length > 0 ? (
                <div className="testimonials-grid">
                  {filteredTestimonials.map((testimonial) => (
                    <TestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                    />
                  ))}
                </div>
              ) : (
                <div className="testimonials-empty">
                  <h3>No feedback in this category</h3>
                  <p>Choose another category to continue.</p>
                </div>
              )}
            </section>
          </>
        )}

        <section className="testimonial-cta">
          <div>
            <span>Are you a VTKS subscriber?</span>
            <h2>Share Your Learning Experience</h2>
            <p>
              Submit your genuine feedback from the subscriber
              dashboard. Every submission is reviewed before
              publication.
            </p>
          </div>

          <Link to="/subscriber/feedback">
            Share Feedback
          </Link>
        </section>

        <section className="testimonial-disclaimer">
          <strong>Important disclosure</strong>

          <p>
            Testimonials represent individual user experiences
            and do not guarantee similar results. Trading and
            investing involve market risk. VTKS provides
            educational tools, structured learning and market
            analysis frameworks, not assured returns.
          </p>
        </section>
      </section>
    </main>
  );
}