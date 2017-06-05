#!/usr/bin/env node

const program = require('commander')

program
  .version('1.0.0')
  .option('-c, --conf', 'provide configuration')

program
  .on('--help', () => {
    console.log('Help is on its way!')
  })

program
  .command('init')
  .action((cmd, options) => {
    console.log('Splitter shall start! (soon)');
  })

program.parse(process.argv)
