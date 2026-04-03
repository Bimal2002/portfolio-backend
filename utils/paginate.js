function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 0, 0);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 0, 0), 100);
  const sort = query.sort || '';
  const order = (query.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;

  return { page, limit, sort, order };
}

module.exports = { parsePagination };
