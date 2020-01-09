import os from 'os';
import nock from 'nock';
import { promises as fs } from 'fs';
import loadPage from '../src';

let expected;
let pathToTempDir;

beforeAll(async () => {
  expected = await fs.readFile(`${__dirname}/__fixtures__/test.html`, 'utf8');
  pathToTempDir = await fs.mkdtemp(`${os.tmpdir()}/test-page-loader-`, 'utf8');
});

test('test with https://hexlet.io/courses', async () => {
  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, expected);

  await loadPage('https://hexlet.io/courses', pathToTempDir);
  const contentOfDownloadedPage = await fs.readFile(`${pathToTempDir}/hexlet-io-courses.html`, 'utf8');
  expect(contentOfDownloadedPage).toBe(expected);
});
