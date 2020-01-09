import axios from 'axios';
import url from 'url';
import { promises as fs } from 'fs';

const convertUrl = (inputUrl) => {
  const urlWithoutProtocol = inputUrl.replace(url.parse(inputUrl).protocol, '');
  return urlWithoutProtocol.replace(/[^\w]+/g, '-').slice(1);
};

export default (webAdress, outputDirPath = __dirname) => {
  const fileName = `${convertUrl(webAdress)}.html`;
  return axios.get(webAdress)
    .then((request) => request.data)
    .then((html) => fs.writeFile(`${outputDirPath}/${fileName}`, html));
};
