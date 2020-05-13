import axios from 'axios';
import url from 'url';
import path from 'path';
import { promises as fs } from 'fs';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import { formHtmlFileName, formLocalFilePath } from './nameFormers';

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
  const addressesAndPaths = [];

  _.entries(searchedTag).forEach(([key, value]) => {
    $(`${key}`).attr(`${value}`, (i, el) => {
      if (isLocal(el)) {
        const parsedPath = path.parse(localResPath);
        const localPathToRes = formLocalFilePath(el, parsedPath.base);
        const absolutePathToRes = formLocalFilePath(el, localResPath);
        addressesAndPaths.push([url.resolve(addr, el), absolutePathToRes]);
        log(`local link ${el} was changed to ${localPathToRes}`);
        return localPathToRes;
      }
      return !el ? null : el;
    });
  });
  log(`html was modified and ${addressesAndPaths.length} local links were extracted`);
  return { html: $.html(), addressesAndPaths };
};

const loadContentFromLocalLink = (link, pathToFile) => axios({
  method: 'get',
  url: link,
  responseType: 'arraybuffer',
})
  .then((response) => response.data)
  .then((content) => {
    fs.writeFile(pathToFile, content);
    log(`load link and save it in ${pathToFile}`);
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
      return !_.isEmpty(modifiedHtmlAndLocalResContainer.addressesAndPaths);
    })
    .then((presenceOfLocalRes) => {
      if (presenceOfLocalRes) {
        fs.mkdir(localResPath, { recursive: true });
        return presenceOfLocalRes;
      }

      fs.mkdir(htmlFilePath, { recursive: true });
      return presenceOfLocalRes;
    })
    .then((presenceOfLocalRes) => {
      if (presenceOfLocalRes) {
        modifiedHtmlAndLocalResContainer.addressesAndPaths
          .forEach(([link, pathToSave]) => loadContentFromLocalLink(link, pathToSave));
      }
      fs.writeFile(htmlFilePath, modifiedHtmlAndLocalResContainer.html);
      log(`load html and save it in ${htmlFilePath}`);
    });
};
