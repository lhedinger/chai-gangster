export function decodeBase64EncodedJson(value) {
  const jsonStringBuffer = Buffer.from(value, 'base64');
  return JSON.parse(jsonStringBuffer.toString());
}

export function encodeBasicAuth(user, password) {
  const str = `${user}:${password}`;
  const encoded = Buffer.from(str).toString('base64');
  return `Basic ${encoded}`;
}

export function encodeAsBase64EncodedJson(obj) {
  const json = JSON.stringify(obj);
  return Buffer.from(json).toString('base64');
}

export function isEncodedAsBase64(header) {
  return (
    typeof header === 'string' &&
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(
      header
    )
  );
}
