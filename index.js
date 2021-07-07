const core = require('@actions/core');
const { deployToFargate } = require('./ecsDeployment');
const { deployToECR } = require('./ecrDeployment');

async function run() {
    try {
        const service = core.getInput('service');
        const version = core.getInput('version');
        const department = core.getInput('department');
        const taskCountString = core.getInput('taskCount');
        const environment = core.getInput('environment');
        const clusterSuffix = core.getInput('environment'); // for deployment to IO, this will not be used
        const withLocalString = core.getInput('withLocal');
        const taskDefinitionPath = core.getInput('taskDefinitionPath');
        const ecrRegistry = core.getInput('ecrRegistry');
        const shouldBuildImage = core.getInput('shouldBuildImage');
        const clusterPrefix = core.getInput('clusterPrefix') || core.getInput('department');

        const taskCount = Number(taskCountString);
        const withLocal = withLocalString === 'true' || withLocalString === true;

        const shouldDeployLocal = environment === 'dev' && withLocal;
        const shouldDeployIO = environment === 'prod'

        console.log('Input Parameters');
        console.log('Service:\t', service);
        console.log('Version:\t', version);
        console.log('Department:\t', department);
        console.log('Task Count:\t', taskCount);
        console.log('Environment:\t', environment);
        console.log('withLocal:\t', withLocal);
        console.log('clusterPrefix:\t', clusterPrefix);
        console.log('Task definition path: ', taskDefinitionPath);
        console.log('ECR Registry: ', ecrRegistry);
        console.log('\n\n');

        await deployToECR({ ecrRegistry, department, service, environment, version, shouldBuildImage });
        await deployToFargate({ service, department, version, taskCount, environment, clusterSuffix , clusterPrefix, taskDefinitionPath})

        if (shouldDeployLocal) {
            console.log('\n\n\n', 'DEPLOYING FOR LOCAL ENVIRONMENT AS WELL');
            await deployToECR({ ecrRegistry, department, service, environment, version: 'local', shouldBuildImage });
            await deployToFargate({ service, department, version: 'local', taskCount: 1, environment: 'local', clusterSuffix: 'local', clusterPrefix, taskDefinitionPath })
        }

        if (shouldDeployIO) {
            await deployToFargate({ service, department, version, taskCount, environment, clusterSuffix: 'io', clusterPrefix, taskDefinitionPath })
        }

    } catch (e) {
        core.setFailed(e.message);
    }
}

run();

