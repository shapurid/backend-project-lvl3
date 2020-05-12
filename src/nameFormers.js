import url from 'url';
import path from 'path';

const removeEndSlash = (str) => (str.slice(-1) === '/' ? str.slice(0, -1) : str);

const normalizeExt = (link) => {
  const { pathname } = url.parse(link);
  return path.extname(pathname);
};

export const formHtmlFileName = (link) => {
  const { hostname, pathname } = url.parse(link);
  const urlWithoutProtocol = path.join(hostname, pathname);
  const nameOfHtmlFile = removeEndSlash(urlWithoutProtocol).replace(/[^\w]+/g, '-');
  return nameOfHtmlFile;
};

export const formLocalFilePath = (link, localResDir) => {
  const { dir, name } = path.parse(link);
  const linkWithoutExt = path.join(dir, name);
  const nameOfLink = removeEndSlash(linkWithoutExt).replace(/[^\w]+/g, '-');
  const extOfFile = normalizeExt(link);
  return path.join(localResDir, `${nameOfLink.slice(1)}${extOfFile}`);
};
