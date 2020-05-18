import os from 'os';
import path from 'path';
import nock from 'nock';
import { promises as fs } from 'fs';
import loadPage from '../src';

nock.disableNetConnect();

const getFixturePath = (fileName) => path.join(__dirname, '__fixtures__', fileName);


let expectedHtml;
let fakeResponse;
let expectedCssFileContent;
let expectedImgFileContent;
let pathToTmpDir;
let incorrectPath;

beforeAll(async () => {
  const readingExpectedHtml = fs.readFile(getFixturePath('testAfter.html'), 'utf8');
  const readingResponseHtml = fs.readFile(getFixturePath('test.html'), 'utf8');
  const readingExpectedCss = fs.readFile(getFixturePath('test_files/screen.css'), 'utf8');
  const readingExpectedImg = fs.readFile(getFixturePath('test_files/image.ico'), 'binary');
  const makingTmpDir = fs.mkdtemp(`${os.tmpdir()}/page-loader-test-`, 'utf8');
  [expectedHtml,
    fakeResponse,
    expectedCssFileContent,
    expectedImgFileContent,
    pathToTmpDir] = await Promise.all([readingExpectedHtml, readingResponseHtml,
    readingExpectedCss, readingExpectedImg, makingTmpDir]);
  incorrectPath = path.join(pathToTmpDir, 'wrongDir.txt');
  await fs.copyFile(getFixturePath('wrongDir.txt'), incorrectPath);
});

beforeEach(() => {
  nock('https://test.com')
    .log(console.log)
    .get('/my')
    .reply(200, fakeResponse)
    .get('/test/screen.css')
    .reply(200, expectedCssFileContent)
    .get('/test/image.ico')
    .reply(200, expectedImgFileContent)
    .get('/about')
    .reply(404);
});

test('page load testing', async () => {
  await loadPage('https://test.com/my', pathToTmpDir);
  const readingHtml = fs.readFile(`${pathToTmpDir}/test-com-my.html`, 'utf8');
  const readingCss = fs.readFile(`${pathToTmpDir}/test-com-my_files/test-screen.css`, 'utf8');
  const readingLocalResDir = fs.readdir(`${pathToTmpDir}/test-com-my_files`);
  const [actualHtml, actualCssFileContent, filesInLocalResDir] = await Promise.all([readingHtml,
    readingCss, readingLocalResDir]);
  expect(actualHtml).toBe(expectedHtml.trim());
  expect(actualCssFileContent).toBe(expectedCssFileContent);
  expect(filesInLocalResDir.length).toBe(2);
});

test('errors testing', async () => {
  await expect(loadPage('https://test.com/my', incorrectPath))
    .rejects.toThrow(`ENOTDIR: '${incorrectPath}/test-com-my_files' is not a directory`);
  await expect(loadPage('https://test.com/about', pathToTmpDir))
    .rejects.toThrow("404: Page 'https://test.com/about' not found");
});
