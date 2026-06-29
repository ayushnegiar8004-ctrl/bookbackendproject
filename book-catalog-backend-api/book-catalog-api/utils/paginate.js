/**
 * Builds pagination metadata and returns the correct slice of results.
 * @param {number} total   - total matching documents
 * @param {number} page    - current page (1-based)
 * @param {number} limit   - items per page
 */
const paginate = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = paginate;
