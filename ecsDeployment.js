const path = require('path');
const fs = require('fs');
const {ECS} = require('aws-sdk');
const ecs = new ECS({region: 'eu-central-1'});

function getClusterName(clusterPrefix, cluster) {
    return `${clusterPrefix}-cluster-${cluster}`;
}

function getServiceName(department, service, environment) {
    return `${department}-service-${service}-${environment}`;
}

/**
 * Register the new version for the given environment
 * @param taskDefinitionPath {string}
 * @param environment {"local" | "dev" | "beta" | "prod"}
 * @param clusterSuffix {"local" | "dev" | "beta" | "prod" | "io"}
 * @param version {string}
 * @returns {Promise<ECS.TaskDefinition>}
 */
async function updateTaskDefinition(taskDefinitionPath, environment, clusterSuffix, version) {
    console.log('Trying to register new revision for task definition');
    console.log('Completing task definition with environment: ', environment, '\nand version: ', version);

    const pathToFile = path.resolve(taskDefinitionPath);
    console.log('Looking for task definition at: ', pathToFile);
    const getPreparedTaskDefinition = require(pathToFile);

    if (typeof getPreparedTaskDefinition !== 'function') {
        throw new Error('Path to the task definition file must reference a file that default exports a function.');
    }

    const params = getPreparedTaskDefinition(environment, clusterSuffix, version);

    // local environment uses dev ECR repository
    if (environment === 'local') {
        params.containerDefinitions[0].image = params.containerDefinitions[0].image.replace('-local', '-dev')
    }

    console.log('Revised task definition to be set looks like', JSON.stringify(params, undefined, 2));
    const {taskDefinition} = await ecs.registerTaskDefinition(params)
        .promise();
    console.log('Successfully registered\n', JSON.stringify(taskDefinition, undefined, 2));
    return taskDefinition;
}

/**
 * Make the service aware of the updated task definition
 * @param department {"ai" | "saas" | "scraper"}
 * @param service {string}
 * @param environment {"local" | "dev" | "beta" | "prod"}
 * @param clusterSuffix {"local" | "dev" | "beta" | "prod" | "io"}
 * @param clusterPrefix {"ai" | "saas" | "scraper"}
 * @param version {string}
 * @param updatedTaskDefinition
 * @param taskCount {number} - how many tasks of a service should run in parallel
 * @returns {Promise<void>}
 */
async function updateService({
                                 department,
                                 service,
                                 environment,
                                 clusterSuffix,
                                 clusterPrefix,
                                 version,
                                 updatedTaskDefinition,
                                 taskCount,
                             }) {
    const serviceName = getServiceName(department, service, environment);
    const clusterName = getClusterName(clusterPrefix, clusterSuffix);

    console.log('Task definition family: ', updatedTaskDefinition.family);
    const taskDefinitionRevision = `${updatedTaskDefinition.family}:${updatedTaskDefinition.revision}`;
    console.log(`Updating service "${serviceName}" in cluster "${clusterName}" to task definition "${taskDefinitionRevision}"`);

    const params = {
        cluster: clusterName,
        service: serviceName,
        taskDefinition: taskDefinitionRevision,
        desiredCount: taskCount,
    };
    console.log('\n\nParams\n', JSON.stringify(params, undefined, 2));
    const {service: ecsService} = await ecs.updateService(params)
        .promise();
    console.log('Updating of service successful:', JSON.stringify(ecsService, undefined, 2));
}

/**
 *
 * @param service {string}
 * @param version {string}
 * @param department {"saas" | "ai"}
 * @param environment {"local" | "dev" | "beta" | "prod"}
 * @param clusterSuffix {"local" | "dev" | "beta" | "prod" | "io"}
 * @param clusterPrefix {"ai" | "saas" | "scraper"}
 * @param taskCount {number} - how many tasks of a service should run in parallel
 * @param taskDefinitionPath {string}
 * @return {Promise<void>}
 */
exports.deployToFargate = async function ({
                                              service,
                                              version,
                                              department,
                                              environment,
                                              clusterSuffix,
                                              clusterPrefix,
                                              taskCount,
                                              taskDefinitionPath,
                                          }) {

    console.log('Initiating deployment to fargate...');
    console.log('Department:', department);
    console.log('Service:', service);
    console.log('Version:', version);
    console.log('ClusterPrefix:', clusterPrefix);
    console.log(`Environment for service "${service}" is "${environment}" with version "${version}"`);
    console.log(`Will be deployed to "${clusterSuffix}" cluster`)

    const taskDefinition = await updateTaskDefinition(taskDefinitionPath, environment, clusterSuffix, version);
    await updateService({
        department,
        service,
        environment,
        clusterSuffix,
        clusterPrefix,
        version,
        updatedTaskDefinition: taskDefinition,
        taskCount,
    });
};
