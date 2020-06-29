import axios from 'axios';
import path from 'path';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import { toPairs, isEmpty } from 'lodash';
import debug from 'debug';
import Listr from 'listr';
import { formHtmlFileName, formLocalFilePath } from './nameFormers';
import errHandler from './errors';
import 'axios-debug-log';

const log = debug('page-loader');

const searchedTag = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const getLinkFromNode = (node) => {
  const { name, attribs } = node;
  return attribs[searchedTag[name]];
};

const isLocal = (checkedLink) => {
  try {
    URL(checkedLink);
    return false;
  } catch {
    return true;
  }
};

const getLocalResLinksAndModifyHtml = (html, addr, localResDirPath) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const baseName = path.basename(localResDirPath);
  const urlsAndPaths = toPairs(searchedTag)
    .flatMap(([key, value]) => $(`${key}[${value}]`)
      .toArray()
      .map(getLinkFromNode)
      .filter(isLocal)
      .map((link) => {
        const uri = new URL(link, addr);
        log(`URL is formed: ${uri}`);
        const absolutePathToRes = formLocalFilePath(link, localResDirPath);
        log(`absolute path to res is formed: '${absolutePathToRes}'`);
        const localPathToRes = formLocalFilePath(link, baseName);
        log(`local path to res is formed: '${localPathToRes}'`);
        $(key).attr(value, localPathToRes);
        return [uri, absolutePathToRes];
      }));
  log(`html was modified and ${urlsAndPaths.length} local links were extracted`);
  return { html: $.html(), urlsAndPaths };
};

const saveLocalResContent = (uri, pathToFile) => {
  const { href } = uri;
  log(`downloading content from '${href}'`);
  return axios.get(href, { responseType: 'arraybuffer' })
    .then((response) => response.data)
    .then((content) => {
      log(`saving content of '${href}' into '${pathToFile}'`);
      return fs.writeFile(pathToFile, content);
    })
    .catch((err) => {
      console.error(errHandler(err));
    });
};

export default (webAdress, outputDirPath) => {
  log(`start loading page '${webAdress}' and save it to '${outputDirPath}'`);
  const baseName = formHtmlFileName(webAdress);
  const htmlFilePath = path.join(outputDirPath, `${baseName}.html`);
  const localResDirPath = path.join(outputDirPath, `${baseName}_files`);
  let modifiedHtmlAndLocalResContainer;

  return axios.get(webAdress)
    .then((response) => response.data)
    .then((html) => {
      log(`received html:\n${html}`);
      modifiedHtmlAndLocalResContainer = getLocalResLinksAndModifyHtml(html,
        webAdress, localResDirPath);
      const { urlsAndPaths } = modifiedHtmlAndLocalResContainer;
      return urlsAndPaths;
    })
    .then((urlsAndPaths) => {
      if (isEmpty(urlsAndPaths)) {
        log(`checking for missing directories and creating them '${outputDirPath}'`);
        return fs.mkdir(outputDirPath, { recursive: true });
      }

      log(`checking for missing directories, creating them '${localResDirPath}'`);
      return fs.mkdir(localResDirPath, { recursive: true });
    })
    .then(() => {
      const { html, urlsAndPaths } = modifiedHtmlAndLocalResContainer;
      const savingHtml = fs.writeFile(htmlFilePath, html, 'utf8');
      const tasks = new Listr(urlsAndPaths
        .map(([uri, pathToSave]) => {
          const title = `saving ${path.basename(pathToSave)}`;
          const task = () => saveLocalResContent(uri, pathToSave);
          return { title, task };
        }));
      const savingLocalResourses = tasks.run();
      return Promise.all([savingHtml, savingLocalResourses]);
    })
    .catch((err) => {
      const handledError = errHandler(err);
      throw new Error(handledError);
    });
};
