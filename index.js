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
        const withLocalString = core.getInput('withLocal');

        const taskCount = Number(taskCountString);
        const withLocal = withLocalString === 'true' || withLocalString === true;

        const shouldDeployLocal = environment === 'dev' && withLocal;

        console.log('Input Parameters');
        console.log('Service:\t', service);
        console.log('Version:\t', version);
        console.log('Department:\t', department);
        console.log('Task Count:\t', taskCount);
        console.log('Environment:\t', environment);
        console.log('withLocal:\t', withLocal);
        console.log('\n\n');

        await deployToECR({ department, service, environment, version });
        await deployToFargate({ service, department, version, taskCount, environment })

        if (shouldDeployLocal) {
            console.log('\n\n\n', 'DEPLOYING FOR LOCAL ENVIRONMENT AS WELL');
            await deployToECR({ department, service, environment, version: 'local' });
            await deployToFargate({ service, department, version: 'local', taskCount: 1, environment })
        }
    } catch (e) {
        core.setFailed(e.message);
    }
}

run();

