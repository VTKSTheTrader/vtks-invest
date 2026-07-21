import "./Pagination.css";

const buildPageNumbers = (
  currentPage,
  totalPages,
  maxVisiblePages
) => {
  if (totalPages <= maxVisiblePages) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const pages = [];
  const sideCount = Math.floor(
    (maxVisiblePages - 3) / 2
  );

  let startPage = Math.max(
    2,
    currentPage - sideCount
  );

  let endPage = Math.min(
    totalPages - 1,
    currentPage + sideCount
  );

  if (currentPage <= sideCount + 2) {
    endPage = maxVisiblePages - 1;
  }

  if (
    currentPage >=
    totalPages - sideCount - 1
  ) {
    startPage =
      totalPages - maxVisiblePages + 2;
  }

  pages.push(1);

  if (startPage > 2) {
    pages.push("start-ellipsis");
  }

  for (
    let page = startPage;
    page <= endPage;
    page += 1
  ) {
    pages.push(page);
  }

  if (endPage < totalPages - 1) {
    pages.push("end-ellipsis");
  }

  pages.push(totalPages);

  return pages;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 7,
  scrollToTop = true,
}) {
  if (
    !totalPages ||
    totalPages <= 1
  ) {
    return null;
  }

  const safeCurrentPage = Math.min(
    Math.max(Number(currentPage) || 1, 1),
    totalPages
  );

  const changePage = (page) => {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages
    );

    if (nextPage === safeCurrentPage) {
      return;
    }

    onPageChange(nextPage);

    if (scrollToTop) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const pageNumbers = buildPageNumbers(
    safeCurrentPage,
    totalPages,
    Math.max(maxVisiblePages, 5)
  );

  return (
    <nav
      className="vtks-pagination"
      aria-label="Pagination"
    >
      <button
        type="button"
        className="vtks-pagination-nav"
        disabled={safeCurrentPage === 1}
        onClick={() =>
          changePage(safeCurrentPage - 1)
        }
      >
        ← Previous
      </button>

      <div className="vtks-pagination-pages">
        {pageNumbers.map((page) => {
          if (
            page === "start-ellipsis" ||
            page === "end-ellipsis"
          ) {
            return (
              <span
                key={page}
                className="vtks-pagination-ellipsis"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          return (
            <button
              key={page}
              type="button"
              className={
                safeCurrentPage === page
                  ? "vtks-pagination-page vtks-pagination-page-active"
                  : "vtks-pagination-page"
              }
              aria-current={
                safeCurrentPage === page
                  ? "page"
                  : undefined
              }
              onClick={() =>
                changePage(page)
              }
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="vtks-pagination-nav"
        disabled={
          safeCurrentPage === totalPages
        }
        onClick={() =>
          changePage(safeCurrentPage + 1)
        }
      >
        Next →
      </button>
    </nav>
  );
}