function queryFromPath(path = "") {
  const qIndex = path.indexOf("?");
  if (qIndex < 0) {
    return { path, query: {} };
  }
  const query = {};
  new URLSearchParams(path.substring(qIndex + 1)).forEach((v, k) => {
    query[k] = v;
  });
  return {
    query,
    path: path.substring(0, qIndex),
  };
}

module.exports = { queryFromPath };
