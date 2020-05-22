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
  const regex = new RegExp('^(\\w)+://|([w]{3}.)', 'i');
  return !regex.test(checkedLink);
};

const getLocalResLinksAndModifyHtml = (html, addr, localResDirPath) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const urlsAndPaths = [];
  const baseName = path.basename(localResDirPath);

  toPairs(searchedTag)
    .forEach(([key, value]) => $(`${key}[${value}]`)
      .filter((i, node) => {
        const linkFromNode = getLinkFromNode(node);
        return isLocal(linkFromNode);
      })
      .each((i, node) => {
        const linkFromNode = getLinkFromNode(node);
        const localPathToRes = formLocalFilePath(linkFromNode, baseName);
        const absolutePathToRes = formLocalFilePath(linkFromNode, localResDirPath);
        const linkUrl = new URL(linkFromNode, addr).href;
        log(`URL is formed: ${linkUrl}`);
        log(`local path to res is formed: '${localPathToRes}'`);
        log(`absolute path to res is formed: '${absolutePathToRes}'`);
        urlsAndPaths.push([linkUrl, absolutePathToRes]);
        $(node).attr(`${value}`, localPathToRes);
      }));
  log(`html was modified and ${urlsAndPaths.length} local links were extracted`);
  return { html: $.html(), urlsAndPaths };
};

const saveLocalResContent = (link, pathToFile) => {
  log(`downloading content from '${link}'`);
  return axios({
    method: 'get',
    url: link,
    responseType: 'arraybuffer',
  })
    .then((response) => response.data)
    .then((content) => {
      log(`saving content of '${link}' into '${pathToFile}'`);
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
  log('send GET request');

  return axios.get(webAdress)
    .then((response) => response.data)
    .then((html) => {
      log(`received:\n${html}`);
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
        .map(([link, pathToSave]) => {
          const title = `saving ${path.basename(pathToSave)}`;
          const task = () => saveLocalResContent(link, pathToSave);
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
