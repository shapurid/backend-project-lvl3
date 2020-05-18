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
      .then(() => console.log(`Page '${webAdress}' was loaded in '${displayPath(program.output)}'`))
      .catch((err) => {
        console.error(`${err.name}: ${err.message}`);
        process.exitCode = 1;
      });
  });

program.parse(process.argv);
