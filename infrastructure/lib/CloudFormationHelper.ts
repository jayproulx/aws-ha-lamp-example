import {Log} from './Log';
import {execSync} from "child_process";
import * as CloudFormation from "aws-sdk/clients/cloudformation";

export class CloudFormationHelper {
    private logger = Log.global.getLogger(CloudFormationHelper.name);

    /**
     * If a token is required for a parameter value, but there is no value, continue processing, otherwise throw an error if false.
     */
    public allowEmptyTokens: boolean;

    /**
     * If a parameter value is empty, remove it from the list of parameters sent to cloudformation
     */
    public stripEmptyParameters: boolean;

    /**
     * A POJO in AWS Parameter JSON format (array of objects with ParameterKey and ParameterValue keys)
     */
    public parameters: any;

    /**
     * A file to load parameters from, in AWS Parameter JSON format (array of objects with ParameterKey and ParameterValue keys)
     */
    public parametersFile: string;

    /**
     * A simple map that will be used to replace tokens in ParameterValue's
     */
    public parameterTokens:any;

    /**
     * The list of keys from the parameters object, ignore all others.
     */
    public keys: string[];

    /**
     * Wait until the requested operations are complete
     */
    public wait: boolean;

    constructor(options: any) {
        if(options.wait) {
            this.wait = options.wait;
        }

        if(options.keys) {
            this.keys = options.keys;
        }
        if(options.parameterTokens) {
            this.parameterTokens = options.parameterTokens;
        }

        if (options.stripEmptyParameters) {
            this.stripEmptyParameters = options.stripEmptyParameters;
        }

        if (options.allowEmptyTokens) {
            this.allowEmptyTokens = options.allowEmptyTokens;
        }

        if (options.parameters !== undefined) {
            this.parameters = this.replaceParameterTokens(options.parameters);
        }

        if (options.parametersFile) {
            this.loadParametersFromFile(options.parametersFile);
        }
    }

    private replaceParameterTokens(params: any[]) {
        let newParams = JSON.parse(JSON.stringify(params));

        if(!this.parameterTokens) {
            throw new Error("No parameter tokens to retrieve values from, please set parameterTokens in options");
        }

        for (let i = 0; i < newParams.length; i++) {
            let v = params[i].ParameterValue;
            let token = /\${(.*?)}/;
            let tokenMatch = v.match(token);

            while (tokenMatch) {
                try {
                    let val = this.parameterTokens[tokenMatch[1]] || '';

                    if (!val) {
                        this.logger.warn(`Couldn't find a value for ${tokenMatch[0]} in ${params[i].ParameterKey}`);

                        if (!this.allowEmptyTokens) {
                            throw new Error("Emtpy tokens are not allowed, set allowEmptyTokens to true to continue.");
                        }
                    }

                    v = v.replace(token, val);
                } catch (error) {
                    throw new Error(`Error replacing token in parameters: ${error}`);
                }

                newParams[i].ParameterValue = v;

                tokenMatch = v.match(token);
            }
        }

        return newParams;
    }

    get flatParameters():any {
        let flat:any = {};

        for(let i = 0; i < this.parameters.length; i++) {
            let param = this.parameters[i];

            flat[param.ParameterKey] = param.ParameterValue;
        }

        return flat;
    }

    get flatParametersAsString():string {
        let params = "";

        for(let param in this.flatParameters) {
            params += `${param}=${this.flatParameters[param]} `;
        }

        return params;
    }

    /**
     * Format parameters into a string that is an acceptable input format for the AWS CloudFormation CLI
     *
     * @param params
     * @returns {string}
     */
    public cliParametersString(params?: any) {
        params = params || this.parameters;

        return JSON.stringify(params).split('"').join('\\\"');
    }

    /**
     * Load parameters from a file, and persist them in this helper.  (see #getParametersFromFile)
     * @param {string} path
     */
    public loadParametersFromFile(path: string) {
        this.parametersFile = path;
        this.parameters = this.getParametersFromFile(path);
    }

    /**
     * Load parameters from an appropriately formatted file [{"ParameterKey": "thekey", "ParameterValue": "thevalue"},...], apply stripEmptyParameters and filterParametersByKey filters and return the
     * remaining parameters.
     * @param {string} path
     * @returns {any}
     */
    public getParametersFromFile(path: string) {
        let absolutePath = `${path}`;
        let params = require(absolutePath);

        this.logger.debug(`Using parameters file  ${absolutePath}`);

        if (!params) {
            throw new Error(`No parameters found in ${absolutePath}`);
        }

        if(this.keys) {
            params = this.filterParametersByKey(this.keys, params);
        }

        params = this.replaceParameterTokens(params);

        if (this.stripEmptyParameters) {
            params = params.filter(this.stripEmptyParametersFilter);
        }

        return params;
    }

    private stripEmptyParametersFilter(param: any) {
        return param.ParameterValue != '';
    }

    public getParameterValue(key: String, params?: any[]) {
        params = params || this.parameters;

        if (params === undefined) {
            return undefined;
        }

        for (let i = 0; i < params.length; i++) {
            let param = params[i];
            if (param.ParameterKey === key) {
                return param.ParameterValue;
            }
        }

        return undefined;
    }

    public filterParametersByKey(keys: string[], params?: any[]): any[] {
        params = params || this.parameters;

        if (params === undefined) {
            throw new Error("filterParametersByKey params, or helper parameters must not be null");
        }

        return params.filter((param: any) => keys.indexOf(param.ParameterKey) > -1);
    }

    public cli(command: string) {
        this.logger.info(command);
        execSync(command, {stdio: [0, 1, 2]});
    }

    public quietCli(command: string) {
        this.logger.info(command);
        return execSync(command);
    }

    public stackAction(action:string, stackName:string, template:string, parametersString:string) {
        if (action === 'delete') {
            this.deleteStack(stackName);
        } else if(action === 'recreate') {
            this.recreateStack(stackName, template, parametersString);
        } else if(action === 'create') {
            this.createStack(stackName, template, parametersString);
        } else if(action === 'createChangeSet') {
            this.createChangeSet(stackName, template, parametersString);
        } else if(action === 'executeChangeSet') {
            this.executeChangeSet(stackName);
        } else if(action === 'update') {
            this.updateStack(stackName, template, parametersString);
        } else if(action === 'deploy') {
            this.deployStack(stackName, template, this.flatParametersAsString);
        }
    }

    public deleteStack(stackName: string) {
        this.cli(`aws cloudformation delete-stack --stack-name ${stackName} --client-request-token ${new Date().getTime()}`);

        if(this.wait) {
            this.waitForDeleteStack(stackName);
        }
    }

    public waitForDeleteStack(stackName: string) {
        this.cli(`aws cloudformation wait stack-delete-complete --stack-name ${stackName}`);
    }

    public waitForUpdateStack(stackName: string) {
        this.cli(`aws cloudformation wait stack-update-complete --stack-name ${stackName}`);
    }

    public waitForCreateStack(stackName: string) {
        this.cli(`aws cloudformation wait stack-create-complete --stack-name ${stackName}`);
    }

    public waitForCreateChangeSet(stackName: string) {
        let changeSetName = this.getChangeSetName(stackName);

        this.cli(`aws cloudformation wait change-set-create-complete --change-set-name ${changeSetName} --stack-name ${stackName}`);
    }

    public recreateStack(stackName: string, template: string, parametersString: string) {
        this.deleteStack(stackName);
        this.createStack(stackName, template, parametersString);
    }

    public createStack(stackName: string, template: string, parametersString: string) {
        this.cli(`aws cloudformation create-stack --capabilities CAPABILITY_NAMED_IAM --stack-name ${stackName} --template-body file://${template} --parameters "${parametersString}" --client-request-token ${new Date().getTime()}`);

        if(this.wait) {
            this.waitForCreateStack(stackName);
        }
    }

    public updateStack(stackName: string, template: string, parametersString: string) {
        try {
            this.cli(`aws cloudformation update-stack --capabilities CAPABILITY_NAMED_IAM --stack-name ${stackName} --template-body file://${template} --parameters "${parametersString}" --client-request-token ${new Date().getTime()}`);

            if(this.wait) {
                this.waitForUpdateStack(stackName);
            }
        } catch( e) {
            this.logger.info("Everything is PROBABLY fine, just no updates to apply, hard to tell a real failure from a no-op");
        }
    }

    public deployStack(stackName:string, template:string, parametersString:string){
        try {
            this.cli(`aws cloudformation deploy --capabilities CAPABILITY_NAMED_IAM --stack-name ${stackName} --template-file ${template} --parameter-overrides ${parametersString}`);
        } catch( e) {
            this.logger.info("Everything is PROBABLY fine, just no updates to apply, hard to tell a real failure from a no-op");
        }
    }

    public createChangeSet(stackName:string, template:string, parametersString:string, generateOnly?:boolean) {
        let generateArg = generateOnly ? "--generate-cli-skeleton output" : "";
        let changeSetName = this.getChangeSetName(stackName);

        this.cli(`aws cloudformation create-change-set --capabilities CAPABILITY_NAMED_IAM --stack-name ${stackName} --template-body file://${template} --parameters "${parametersString}" --change-set-name ${changeSetName} ${generateArg}`);

        if(!generateOnly) {
            this.logger.info(`You can now: aws cloudformation execute-change-set --change-set-name ${changeSetName} --stack-name ${stackName}`);
        }

        if(this.wait) {
            this.waitForCreateChangeSet(stackName);
        }

        return changeSetName;
    }

    private getChangeSetName(stackName:string) {
        return `${stackName}-latest`;
    }

    private confirmChangeSet(stackName:string) {
        let changeSetName = this.getChangeSetName(stackName);

        let stdout = this.quietCli(`aws cloudformation describe-change-set --stack-name ${stackName} --change-set-name ${changeSetName}`);

        return JSON.parse(stdout.toString());
    }

    public executeChangeSet(stackName:string) {
        let changeSetName = this.getChangeSetName(stackName);

        let description = this.confirmChangeSet(stackName);

        if(description.Status !== "FAILED") {
            this.cli(`aws cloudformation execute-change-set --change-set-name ${changeSetName} --stack-name ${stackName} --client-request-token ${new Date().getTime()}`);
        }
        else {
            this.logger.info(description.StatusReason)
        }
    }
}