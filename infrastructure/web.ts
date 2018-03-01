#!/usr/bin/env ts-node

import {CloudFormationHelper} from "./lib/CloudFormationHelper";

let yargs = require('yargs')
        .usage('Manage the Web stack.\nUsage: $0')
        .alias('H', 'help')
        .describe('help', 'Print usage and quit.')
        .alias('a', 'action')
        .describe('action', 'CloudFormation action')
        .default('action', "update")
        .choices('action', ["create", "update", "delete", "recreate", "deploy", "createChangeSet", "executeChangeSet"])
        .alias('s', 'stackName')
        .describe('stackName', 'CloudFormation Stack Name')
        .default('stackName', "Web")
        .alias('e', 'environment')
        .describe('environment', 'Environment to deploy stack to')
        .choices('environment', ['Dev', 'Prod'])
        .default('environment', 'Prod')
        .alias('w', 'wait')
        .describe('wait', 'Wait for operations to complete before returning.')
        .boolean('wait')
        .describe('parameters', 'Parameters file')
        .default('parameters', `parameters.json`)
        .alias('t', 'template')
        .describe('template', 'CloudFormation template body')
        .default('template', `web.yaml`),
    argv = yargs.argv;

if (argv.H) {
    yargs.showHelp();
    process.exit(0);
}

argv.parameters = `${__dirname}/${argv.parameters}`;
argv.template = `${__dirname}/${argv.template}`;

let helper = new CloudFormationHelper({
    allowEmptyTokens: true,
    stripEmptyParameters: true,
    parametersFile: argv.parameters,
    keys: ["AppName", "Environment", "CertificateArn"],
    wait: argv.wait,
    parameterTokens: {
        environment: argv.environment
    }
});
let parametersString = helper.cliParametersString();
let stackName = `${helper.getParameterValue("AppName")}${argv.environment}${argv.stackName}`;

helper.stackAction(argv.action, stackName, argv.template, parametersString);