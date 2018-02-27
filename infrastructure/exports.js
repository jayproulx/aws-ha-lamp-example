#!/usr/bin/env node

var fs = require('fs'),
    AWS = require('aws-sdk'),
    yargs = require('yargs')
        .usage('Export CloudFormation parameters in a format appropriate for consuming in the web application.\nUsage: $0')
        .alias('H', 'help')
        .describe('help', 'Print usage and quit.')
        .describe('appName', 'Name of the application from the parameters, used with environment to find exports specific to this application.')
        .demandOption('appName')
        .describe('environment', 'Environment to deploy stack to')
        .choices('environment', ['Dev', 'Prod'])
        .default('environment', 'Prod')
        .alias('o', 'output')
        .describe('output', 'Output file in json format')
        .default('output', "./exports.json")
        .alias('d', 'dump')
        .describe('dump', 'Dump to console, don\'t write to a file.')
        .boolean('dump')
        .alias('p', 'pretty')
        .describe('pretty', 'Format the output with tabs')
        .boolean('pretty'),
    argv = yargs.argv;

if (argv.H) {
    yargs.showHelp();
    process.exit(0);
}

AWS.config.update({region: 'us-east-1'});

let cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

cloudformation.listExports({}, function (err, data) {
    let exportKey = `${argv.appName}${argv.environment}`;

    if (err) {
        console.error(err, data);
        process.exit(1);
    }

    let exports = {};
    for (let prop of data.Exports) {
        if (!prop.Name.startsWith(exportKey)) continue;

        exports[prop.Name.replace(exportKey, '')] = prop.Value;
    }

    let formatted = (argv.pretty) ? JSON.stringify(exports, null, '\t') : JSON.stringify(exports);

    if(argv.dump) {
        console.log(formatted);
    } else {
        fs.writeFileSync(argv.output, formatted);
    }
});