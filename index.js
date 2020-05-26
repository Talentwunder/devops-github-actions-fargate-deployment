const core = require('@actions/core');
const { deploy } = require('src/deployToFargate')

async function run() {
    try {
        const service = core.getInput('service');
        const version = core.getInput('version');
        const department = core.getInput('department');
        const taskCount = core.getInput('taskCount');
        const environment = core.getInput('environment');
        const taskDefinitionPath = core.getInput('taskDefinitionPath');

        await deploy({
            service,
            department,
            version,
            taskCount: Number(taskCount),
            environment,
            taskDefinitionPath
        })
    } catch (e) {
        core.setFailed(e.message);
    }
}

run();

