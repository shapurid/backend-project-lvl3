import path from 'path';

const removeEndSlash = (str) => (str.slice(-1) === '/' ? str.slice(0, -1) : str);

const normalizeExt = (link) => {
  const regexp = new RegExp('(\\?.*)$', 'i');
  const linkWithoutQueryString = link.replace(regexp, '');
  return path.extname(linkWithoutQueryString);
};

export const formHtmlFileName = (link) => {
  const { hostname, pathname } = new URL(link);
  const urlWithoutProtocol = path.join(hostname, pathname);
  const nameOfHtmlFile = removeEndSlash(urlWithoutProtocol).replace(/[^\w]+/g, '-');
  return nameOfHtmlFile;
};

export const formLocalFilePath = (link, localResDir) => {
  const { dir, name } = path.parse(link);
  const linkWithoutExt = path.join(dir, name);
  const nameOfLink = removeEndSlash(linkWithoutExt).replace(/[\W]/g, '-');
  const extOfFile = normalizeExt(link);
  return path.join(localResDir, `${nameOfLink.slice(1)}${extOfFile}`);
};
