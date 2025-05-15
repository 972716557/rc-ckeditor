export const splitStyle = (str: string, type: 'color' | 'font-size' | 'text-align') => {
  if (!str) return false;
  const regStr = `${type}.*?;`;
  const reg = new RegExp(regStr, 'gi');
  const res = str.match(reg);
  if (res === null) {
    return false;
  }
  const matchStr = res[0];
  const tempStr = matchStr?.slice(type.length + 1, matchStr.length - 1)?.trim();
  return tempStr;
};
