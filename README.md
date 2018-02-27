# aws-ha-lamp-example

## Goals
- True high availability LAMP environment, duplication and failover for all services across multiple availability zones
- Lower latency and reduce load
- Additional support for improved disk I/O

## notes:
- Tested only in us-east-1, as CloudFront wants ACM certificates in us-east-1, otherwise the certificates need to be split into separate stacks
- By default, an Elastic Beanstalk environment will create an ELB with instances in several subnets in the region, the instances are in public subnets (IGW) but the security group is restricted to the group associated with the ELB.
- Cross zone load balancing is disabled by default for the Elastic Beanstalk ELB, and would need to be enabled, with a second ELB in a separate AZ for proper high availability
- This stack creates ACM certificates, which requires a domain technical contact to manually approve the request to create the certificate, CloudFormation stack won't complete until the cert is approved
- Default Elastic Beanstalk environment will provision t1.micro instances, suitable for free tier
- CloudFront in front of static resources and application will lower latency for certain requests within TTL across geographies
- CloudFront will additionally reduce load on resources  

## todo:

- [ ] Find the default AWS PHP intro project to extend for this demo
- [ ] README.md files in all folders to describe intents and usage
- [ ] Document infrastructure with readme for all stack scripts and a description of standard functionality
- [ ] Configure Elastic Beanstalk for HTTPS: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/configuring-https.html
- [ ] Add CloudFront distribution in front of EB ELB, disable caching for demonstration of balancing
- [ ] Add RDS Aurora MySQL master/replica to 2 availability zones
- [ ] Restrict Elastic Beanstalk Auto Scaling Group to 2 specific availability zones to match with Aurora
- [ ] Add CloudFront distribution for Elastic Beanstalk environment
- [ ] Update PHP application to display current local IP or instance id to distinguish between instances in demo
- [ ] Add minimum of 2 instances to Auto Scaling Group to demonstrate balancing
- [ ] Ideally add additional ELB to EB environment in separate availability zone
- [ ] Stretch goal: Add Elasticache and configure PHP for memcached cluster in 2 availability zones
- [ ] Stretch goal: on EB startup add 2 RAID0 EBS volumes for higher disk I/O (confirm requirement)  
