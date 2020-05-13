import os from 'os';
import path from 'path';
import nock from 'nock';
import { promises as fs } from 'fs';
import loadPage from '../src';

nock.disableNetConnect();

const getFixturePath = (fileName) => path.join(__dirname, '__fixtures__', fileName);


let expectedHtml;
let fakeResponse;
let pathToTmpDir;
let expectedCssFileContent;
let expectedImgFileContent;

beforeAll(async () => {
  expectedHtml = await fs.readFile(getFixturePath('testAfter.html'), 'utf8');
  fakeResponse = await fs.readFile(getFixturePath('test.html'), 'utf8');
  expectedCssFileContent = await fs.readFile(getFixturePath('test_files/screen.css'), 'utf8');
  expectedImgFileContent = await fs.readFile(getFixturePath('test_files/image.ico'));
  pathToTmpDir = await fs.mkdtemp(`${os.tmpdir()}/page-loader-test-`, 'utf8');
  nock('https://test.com')
    .log(console.log)
    .get('/my/')
    .reply(200, fakeResponse)
    .get('/test/screen.css')
    .reply(200, expectedCssFileContent)
    .get('/test/image.ico')
    .reply(200, expectedImgFileContent);
});

test('test', async () => {
  await loadPage('https://test.com/my/', pathToTmpDir);
  const actualHtml = await fs.readFile(`${pathToTmpDir}/test-com-my.html`, 'utf8');
  const actualCssFileContent = await fs.readFile(`${pathToTmpDir}/test-com-my_files/test-screen.css`, 'utf8');
  const actualImgFileContent = await fs.readFile(`${pathToTmpDir}/test-com-my_files/test-image.ico`);
  expect(actualHtml).toBe(expectedHtml.trim());
  expect(actualCssFileContent).toBe(expectedCssFileContent);
  expect(actualImgFileContent).toEqual(expectedImgFileContent);
});
