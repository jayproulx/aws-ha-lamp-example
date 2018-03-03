# aws-ha-lamp-example

## Goals
- True high availability LAMP environment, duplication and failover, and self healing for services across multiple availability zones
- Lower latency and reduce load
- Additional support for improved disk I/O
- A MySQL database
- Disaster Recovery (RDS Backups, S3 replication across availability zones, EBS snapshots if necessary)

## Notes:
- This demo, in it's most simple form, could simply be a Elastic Beanstalk app with the default functionality, however, it's meant to demonstrate given requirements
- Any resources provisioned by these stacks may incur charges in your AWS account, steps have been taken to keep these low, and most services should fall within the free-tier.
- In order to keep with free tier, the database stack will be launched as a db.t2.micro in a single availability zone rather than a Multi-AZ deployment, this compromises the availability, but keeps costs down for the example
- These stacks already support multiple environments (Dev and Prod)
- Tested only in us-east-1, as CloudFront wants ACM certificates in us-east-1
- By default, an Elastic Beanstalk environment will create an ELB with instances in several subnets in the region, the instances are in public subnets (IGW) but the security group is restricted to the group associated with the ELB.
- Default Elastic Beanstalk environment will provision t1.micro instances, suitable for free tier
- CloudFront in front of static resources and application will lower latency for certain requests within TTL across geographies
- CloudFront will additionally reduce load on resources  
- RDS connection info is passed through cloudformation template parameters, ideally these should be stored in SSM

## Instructions:

- These instructions assume that you already have an AWS account, an IAM user with sufficient access, and have the AWS CLI installed and configured locally
- Review the docs in ./infrastructure/README.md and deploy the CloudFormation stacks
- Deploy the Elastic Beanstalk application following the documentation in ./web/README.md

## todo:

- [x] Find the default AWS PHP intro project to extend for this demo https://github.com/awslabs/eb-demo-php-simple-app
- [x] README.md files in all folders to describe intents and usage
- [x] Document infrastructure with readme for all stack scripts and a description of standard functionality
- [x] Add RDS MySQL master/replica to 2 availability zones (compromised to a master in 1 AZ to keep within free tier)
- [x] Add CloudFront distribution in front of EB ELB, disable caching for demonstration of balancing (with HTTPS)
- [x] Add minimum of 2 instances to Auto Scaling Group to demonstrate balancing
- [x] Cross zone load balancing is disabled by default for the Elastic Beanstalk ELB, and would need to be enabled
- [x] Switched to Application Load Balancer which has cross zone enabled by default.
- [x] Update PHP application to display current local IP or instance id to distinguish between instances in demo
- [x] Stretch goal: CodeBuild for CI/CD
- [x] S3 Default Encryption https://docs.aws.amazon.com/AmazonS3/latest/dev/bucket-encryption.html
- [x] Demonstrate referencing an asset from the static distribution
- [ ] RDS Resource encryption https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html (Not available for db.t2.micro free tier)
- [ ] Configure Elastic Beanstalk for HTTPS: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/configuring-https.html
- [ ] (Deprecated since we're sticking to a single AZ to stay within free tier) Restrict Elastic Beanstalk Auto Scaling Group to 2 specific availability zones to match with MySQL
- [ ] Stretch goal: Add Elasticache and configure PHP for memcached cluster in 2 availability zones https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/customize-environment-resources-elasticache.html
- [ ] Stretch goal: on EB startup add 2 RAID0 Encrypted EBS volumes for higher disk I/O
- [ ] Stretch goal: RDS Parameters in SSM
