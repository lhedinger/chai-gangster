import fs from 'fs';
import xml2js from 'xml2js';
export async function xmlToJson(payload, simplified = true) {
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

export function transformToXml(fields, templateName) {
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
