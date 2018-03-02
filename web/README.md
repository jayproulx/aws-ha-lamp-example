# Elastic Beanstalk + PHP Demo App - "Share Your Thoughts"

## Description

This PHP sample is extended from https://github.com/awslabs/eb-demo-php-simple-app

It has been modified to display the current instance id to demonstrate load balancing.

## Instructions

This demo app shows you how to run a simple PHP application on AWS Elastic Beanstalk.

## Run the App

Follow the steps below to deploy the demo application to an Elastic Beanstalk PHP environment. Accept the default settings unless indicated otherwise in the steps below:

1. Follow the instructions in ../infrastructure/README.md
1. Install the Elastic Beanstalk CLI https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3-install.html
1. You may need to re-initialize .elasticbeanstalk for your environment, run `eb init`
1. `eb deploy`