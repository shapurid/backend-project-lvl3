#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';
import { version } from '../../package.json';

const displayPath = (outputDirPath) => (outputDirPath === process.cwd() ? 'current working directory' : outputDirPath);

program
  .version(version, '-V, --version', 'output the version number')
  .description('Load web-page')
  .arguments('<webAdress>')
  .option('--output [outputDirPath]', 'output dir', process.cwd())
  .action((webAdress, options) => {
    loadPage(webAdress, options.output)
      .then(() => console.log(`Page '${webAdress}' was loaded into '${displayPath(program.output)}'`))
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
        process.exit(1);
      });
  });

program.parse(process.argv);
