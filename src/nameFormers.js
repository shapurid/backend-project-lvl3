import path from 'path';
import { trimEnd } from 'lodash';

const normalizeExt = (link) => {
  const regexp = new RegExp('(\\?.*)$', 'i');
  const linkWithoutQueryString = link.replace(regexp, '');
  return path.extname(linkWithoutQueryString);
};

export const formHtmlFileName = (link) => {
  const { hostname, pathname } = new URL(link);
  const urlWithoutProtocol = path.join(hostname, pathname);
  const nameOfHtmlFile = trimEnd(urlWithoutProtocol, '/').replace(/\W+/g, '-');
  return nameOfHtmlFile;
};

export const formLocalFilePath = (link, localResDir) => {
  const { dir, name } = path.parse(link);
  const linkWithoutExt = path.join(dir, name);
  const nameOfLink = trimEnd(linkWithoutExt, '/').replace(/\W/g, '-');
  const extOfFile = normalizeExt(link);
  return path.join(localResDir, `${nameOfLink.slice(1)}${extOfFile}`);
};
