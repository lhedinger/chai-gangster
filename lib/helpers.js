const fs = require("fs");

function mockDateTime() {
  Date.now = () => new Date("2012-01-31T23:30:00.000Z").getTime();
}

function loadFile(path) {
  // eslint-disable-next-line no-sync
  return fs.readFileSync(`test/data/${path}`, { encoding: "utf8" });
}

function loadJson(path) {
  // eslint-disable-next-line no-sync
  const jsonStr = loadFile(path);
  return JSON.parse(jsonStr);
}

module.exports = {
  mockDateTime,
  loadFile,
  loadJson,
};
