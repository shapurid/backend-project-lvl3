import axios from 'axios';
import url from 'url';
import path from 'path';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import { formHtmlFileName, formLocalFilePath } from './nameFormers';
import errHandler from './errors';

require('axios-debug-log');

const log = debug('page-loader');

const searchedTag = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const isLocal = (checkedLink) => checkedLink && !url.parse(checkedLink).hostname;

const getLocalResLinksAndModifyHtml = (html, addr, localResPath) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const linksAndPaths = [];

  _.toPairs(searchedTag).forEach(([key, value]) => {
    $(`${key}`).attr(`${value}`, (i, el) => {
      if (isLocal(el)) {
        const parsedPath = path.parse(localResPath);
        const localPathToRes = formLocalFilePath(el, parsedPath.base);
        const absoluteResPath = formLocalFilePath(el, localResPath);
        linksAndPaths.push([url.resolve(addr, el), absoluteResPath]);
        log(`local link ${el} was changed to ${localPathToRes}`);
        return localPathToRes;
      }
      return !el ? null : el;
    });
  });
  log(`html was modified and ${linksAndPaths.length} local links were extracted`);
  return { html: $.html(), linksAndPaths };
};

const saveLocalResContent = (link, pathToFile) => axios({
  method: 'get',
  url: link,
  responseType: 'arraybuffer',
})
  .then((response) => response.data)
  .then((content) => {
    log(`load link and save it in ${pathToFile}`);
    return fs.writeFile(pathToFile, content);
  })
  .catch((err) => {
    console.error(errHandler(err));
  });

export default (webAdress, outputDirPath = './') => {
  log(`start loading page '${webAdress}' and save it to '${outputDirPath}'`);
  const baseName = formHtmlFileName(webAdress);
  const htmlFilePath = path.join(outputDirPath, `${baseName}.html`);
  const localResPath = path.join(outputDirPath, `${baseName}_files`);
  let modifiedHtmlAndLocalResContainer;
  log('send GET request');

  return axios.get(webAdress)
    .then((response) => {
      log('received response and get html');
      return response.data;
    })
    .then((html) => {
      modifiedHtmlAndLocalResContainer = getLocalResLinksAndModifyHtml(html,
        webAdress, localResPath);
      const { linksAndPaths } = modifiedHtmlAndLocalResContainer;
      return !_.isEmpty(linksAndPaths);
    })
    .then((presenceOfLocalRes) => {
      if (presenceOfLocalRes) {
        log(`checking for missing directories, creating them '${localResPath}'`);
        return fs.mkdir(localResPath, { recursive: true });
      }

      log(`checking for missing directories and creating them '${outputDirPath}'`);
      return fs.mkdir(outputDirPath, { recursive: true });
    })
    .then(() => {
      const { html, linksAndPaths } = modifiedHtmlAndLocalResContainer;
      const savingHtml = fs.writeFile(htmlFilePath, html, 'utf8');
      const savingLocalResourses = linksAndPaths
        .forEach(([link, pathToSave]) => saveLocalResContent(link, pathToSave));
      log(`load html and save it in ${htmlFilePath}`);
      return Promise.all([savingHtml, savingLocalResourses]);
    })
    .catch((err) => {
      const handledError = errHandler(err);
      throw new Error(handledError);
    });
};
