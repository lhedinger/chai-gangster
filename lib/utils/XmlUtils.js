const fs = require("fs");
const xml2js = require("xml2js");
async function xmlToJson(payload, simplified = true) {
  const parser = new xml2js.Parser({
    trim: simplified,
    explicitArray: false,
    ignoreAttrs: simplified,
    tagNameProcessors: [
      xml2js.processors.stripPrefix,
      xml2js.processors.firstCharLowerCase,
    ],
    attrNameProcessors: [],
    valueProcessors: [],
    attrValueProcessors: [],
  });

  return await parser.parseStringPromise(payload);
}

function transformToXml(fields, templateName) {
  // eslint-disable-next-line no-sync
  let template = fs
    .readFileSync(`app/src/shared/clients/mbps_templates/${templateName}`)
    .toString();
  // simple search and replace of placeholders
  Object.keys(fields).forEach((key) => {
    template = template.replace(`#${key}`, fields[key]);
  });
  return template;
}

module.exports = {
  xmlToJson,
  transformToXml,
};
