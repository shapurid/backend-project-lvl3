#!/usr/bin/env node
import program from 'commander';
import loadPage from '..';
import { version } from '../../package.json';

const displayPath = (outputDirPath) => (outputDirPath === './' ? 'current working directory' : outputDirPath);

program
  .version(version, '-V, --version', 'output the version number')
  .description('Load web-page')
  .arguments('<webAdress>')
  .option('--output [outputDirPath]', 'output dir', './')
  .action((webAdress, options) => {
    loadPage(webAdress, options.output)
      .then(() => console.log(`Page ${webAdress} was loaded in ${displayPath(program.output)}`));
  });

program.parse(process.argv);
