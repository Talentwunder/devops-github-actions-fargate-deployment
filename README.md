# TW Fargate Deployment GitHub Action 

This action updates the task definition for a given service and additionally
triggers a new deployment to the affected service. 

## Inputs

### `service`

**Required** The name of the service to be updated, e.g. `agenda`

### `version`

**Required** Version of the updated service, e.g. `1.0.2`

### `department`

**Required** Specify which department is responsible for the service.
Supported values:
 - `saas`
 - `ai`

### `taskCount`

**Required** How many tasks should run in parallel as part of the service.
Defaults to `1`

### `environment`

**Required** The referenced environment for the deployment
Supported values:
 - `local`
 - `dev`
 - `beta`
 - `prod`
 
 ### `taskDefinitionPath`
 
 **Required** Defines the location of the task definition file.
 Defaults to `taskdefintion.js`.
 
 This file must contain a default export with a function that accepts two parameters:
 - environment {"local" | "dev" | "beta" | "prod"}
 - version {string}

## Example usage

```
uses: actions/devops-github-actions-fargate-deployment@master
with:
  service: 'agenda'
  version: '1.0.2'
  department: 'saas'
  taskCount: 1
  environment: 'dev'
  taskDefinitionPath: 'ops/taskdefinition.js'
```
