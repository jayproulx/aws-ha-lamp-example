# Infrastructure

## Description

This folder contains AWS CloudFormation templates and some Node.js command line tools to simplify the configuration 
and creation of the environment for this example.

## Before you start

The ACM stack will generate SSL certificates with AWS Certificate Manager, which will need to be approved by the
technical contact associated with your domain, you can determine the technical contact with `whois`, or contact the 
administrator for your domain. *The CloudFormation stack won't complete until the cert is approved*.

You can register a domain with Route53 inexpensively for this example if you wish, specify yourself as the technical contact. 

## Instructions

1. If you wish to use the Node.js command line tools, you'll need to install Node.js first https://nodejs.org/en/download/
1. Create a parameters.json file from the provided example.parameters.json file, and configure the values for your needs
1. Create a tokens.json file from the example, which will be used to conveniently store sensitive values for multiple deployments
1. You can commit parameters.json in your own repository as you wish, don't commit the tokens.json file, and make sure to store those values somewhere secure (like 1password, or AWS SSM)
1. Create the ACM Stack, which will provision an SSL Certificate that you can use for different resources in this example
1. Create the RDS Stack, which will provide database services for the web stack  
1. Create the Web stack, this will generate a high availability Elastic Beanstalk application to deploy your code to
1. Optionally, if you're using Route53, you can deploy the DNS stack to create A record aliases for the resources in the Web stack.
1. Optionally, if you'd like to deploy to elastic beanstalk automatically, install the CICD stack

## Additional Notes

1. The Database instances by default only allow access from a particular security group, which can be changed to a security group assigned to the Beanstalk instances
1. To access the database from, for example, MySQL Workbench, update the security group ingress to allow access to 3306 from your IP address (or anywhere, inadvisedly)
1. You'll need to manually create a database (and specify it in parameters.json) in the database instance 

## AWS Certificate Manager Stack

```
Manage the AWS Certificate Manager Stack.
Usage: acm.ts

Options:
  --version          Show version number                               [boolean]
  --parameters       Parameters file                [default: "parameters.json"]
  -H, --help         Print usage and quit.                             [boolean]
  -a, --action       CloudFormation action                   [default: "update"]
  -s, --stackName    CloudFormation Stack Name                  [default: "ACM"]
  -e, --environment  Environment to deploy stack to            [default: "Prod"]
  -w, --wait         Wait for operations to complete before returning. [boolean]
  -t, --template     CloudFormation template body          [default: "acm.yaml"]
```

## Web Stack

```
Manage the Web stack.
Usage: web.ts

Options:
  --version          Show version number                               [boolean]
  --parameters       Parameters file                [default: "parameters.json"]
  -H, --help         Print usage and quit.                             [boolean]
  -a, --action       CloudFormation action                   [default: "update"]
  -s, --stackName    CloudFormation Stack Name                  [default: "Web"]
  -e, --environment  Environment to deploy stack to            [default: "Prod"]
  -w, --wait         Wait for operations to complete before returning. [boolean]
  -t, --template     CloudFormation template body          [default: "web.yaml"]
```

## DNS Stack

```
Manage the Route53 Stack.
Usage: dns.ts

Options:
  --version          Show version number                               [boolean]
  --parameters       Parameters file                [default: "parameters.json"]
  -H, --help         Print usage and quit.                             [boolean]
  -a, --action       CloudFormation action                   [default: "update"]
  -s, --stackName    CloudFormation Stack Name                  [default: "DNS"]
  -e, --environment  Environment to deploy stack to            [default: "Prod"]
  -w, --wait         Wait for operations to complete before returning. [boolean]
  -t, --template     CloudFormation template body          [default: "dns.yaml"]
```

## Continuous Integration Stack

```
Manage the CI/CD Stack.
Usage: cicd.ts

Options:
  --version          Show version number                               [boolean]
  --parameters       Parameters file                [default: "parameters.json"]
  -H, --help         Print usage and quit.                             [boolean]
  -a, --action       CloudFormation action                   [default: "update"]
  -s, --stackName    CloudFormation Stack Name                 [default: "CICD"]
  -e, --environment  Environment to deploy stack to            [default: "Prod"]
  -w, --wait         Wait for operations to complete before returning. [boolean]
  -t, --template     CloudFormation template body         [default: "cicd.yaml"]
```

## Database Stack

```
Manage the Database Stack.
Usage: db.ts

Options:
  --version           Show version number                              [boolean]
  --parameters        Parameters file               [default: "parameters.json"]
  --databasePassword  Database Password                            [default: ""]
  -H, --help          Print usage and quit.                            [boolean]
  -a, --action        CloudFormation action                  [default: "update"]
  -s, --stackName     CloudFormation Stack Name                  [default: "DB"]
  -e, --environment   Environment to deploy stack to           [default: "Prod"]
  -w, --wait          Wait for operations to complete before returning.[boolean]
  -t, --template      CloudFormation template body          [default: "db.yaml"]
```

## Exports Utility

```
Export CloudFormation parameters in a format appropriate for consuming in the
web application.
Usage: exports.js

Options:
  --version      Show version number                                   [boolean]
  --appName      Name of the application from the parameters, used with
                 environment to find exports specific to this application.
                                                                      [required]
  --environment  Environment to deploy stack to
                                      [choices: "Dev", "Prod"] [default: "Prod"]
  -H, --help     Print usage and quit.                                 [boolean]
  -o, --output   Output file in json format          [default: "./exports.json"]
  -d, --dump     Dump to console, don't write to a file.               [boolean]
  -p, --pretty   Format the output with tabs                           [boolean]
```

## Example

```bash
# npm install
# echo "Make sure to edit your parameters.json and tokens.json files first"
# echo "Make sure to manually approve the certificates that this stack creates"
# ./acm.ts --action create
# echo "Wait for the database stack to finish creating before proceeding to create the web stack"
# ./db.ts --action create
# echo "Once this stack is created, you can now use the Elastic Beanstalk CLI to deploy your application"
# ./web.ts --action create
# echo "Deploy the php beanstalk sample" 
# cd ../web; eb deploy; cd ../infrastructure
# echo "Optionally install the CICD stack"
# ./cicd.ts --action create
# echo "Optionally update Route53 with aliases for the cloudfront distributions"
# ./dns.ts --action create
```