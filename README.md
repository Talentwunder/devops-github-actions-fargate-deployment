# TW Fargate Deployment GitHub Action 

This action updates includes the following steps:
- building, tagging and pushing a docker image to ECR for the specified service
- update the provided task definition and re-deploy the specified service with it
triggers a new deployment to the affected service.

**Prerequisites**: There needs to be a `taskdefinition.js` file in the root of the repository.
This file must contain a default export with a function that accepts two parameters:
- environment `{ "local" | "dev" | "beta" | "prod"}`
- version `{string}`
    
Also, you need to make sure the following environment variables
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_NUMBER`

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
 
 ### `withLocal`
 
 **Required** Defines whether a local image should also be tagged in the dev environment. Defaults to `true`.

## Example usage

```yaml
uses: Talentwunder/devops-github-actions-fargate-deployment@v1
with:
  service: 'agenda'
  version: '1.0.2'
  environment: 'dev'
  department: 'saas'
  taskCount: 1
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  AWS_ACCOUNT_NUMBER: ${{ secrets.AWS_ACCOUNT_NUMBER }}
```

