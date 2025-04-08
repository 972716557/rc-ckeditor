// @flow

type Attributes = { [key: string]: string };
type StringMap = { [key: string]: string };

// Lifted from: https://github.com/facebook/react/blob/master/src/renderers/dom/shared/HTMLDOMPropertyConfig.js
const ATTR_NAME_MAP: StringMap = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
};

function normalizeAttributes(attributes?: Attributes) {
  if (!attributes) {
    return attributes;
  }
  let normalized: Record<string, string> = {};
  for (let name of Object.keys(attributes)) {
    let newName = name;
    if (ATTR_NAME_MAP.hasOwnProperty(name)) {
      newName = ATTR_NAME_MAP[name];
    }
    normalized[newName] = attributes[name];
  }
  return normalized;
}

export default normalizeAttributes;
