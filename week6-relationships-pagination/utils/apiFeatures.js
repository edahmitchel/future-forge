/**
 * APIFeatures — chainable helper that wraps a Mongoose query and progressively
 * applies filtering, sorting, field selection, and pagination based on the
 * raw query string from Express (req.query).
 *
 * Usage in a controller:
 *   const features = new APIFeatures(Post.find(), req.query)
 *     .filter()
 *     .sort()
 *     .limitFields()
 *     .paginate();
 *   const posts = await features.query;
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query; // Mongoose Query object
    this.queryString = queryString; // Express req.query object
  }

  // --- Filtering ---
  // Converts ?published=true&views[gte]=10 into a proper Mongo filter.
  // Reserved keys (page, sort, limit, fields) are stripped first,
  // then gte/gt/lte/lt operators are prefixed with $ so Mongoose accepts them.
  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ["page", "sort", "limit", "fields", "search"];
    excluded.forEach((key) => delete queryObj[key]);

    // Replace gte|gt|lte|lt with $gte|$gt|$lte|$lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replaceAll(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this; // enable chaining
  }

  // --- Full-text Search ---
  // Requires a text index on the collection (see Post model).
  // Usage: ?search=express+tutorial
  search() {
    if (this.queryString.search) {
      this.query = this.query.find({
        $text: { $search: this.queryString.search },
      });
    }
    return this;
  }

  // --- Sorting ---
  // Usage: ?sort=createdAt (asc) or ?sort=-createdAt (desc)
  // Default falls back to newest-first.
  sort() {
    if (this.queryString.sort) {
      // Allow multiple sort fields: ?sort=title,-createdAt → "title -createdAt"
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // --- Field Selection (projection) ---
  // Usage: ?fields=title,author,createdAt
  // Strip the internal __v field by default.
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // --- Pagination ---
  // Usage: ?page=2&limit=10
  // Default: page 1, 10 results per page.
  paginate() {
    const page = Math.max(1, Number(this.queryString.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(this.queryString.limit) || 10),
    );
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // Attach pagination meta so controllers can include it in responses
    this.paginationMeta = { page, limit };
    return this;
  }
}

module.exports = APIFeatures;
