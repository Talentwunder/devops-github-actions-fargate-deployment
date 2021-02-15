const exec = require('@actions/exec');

const ACCOUNT_NUMBER = process.env.AWS_ACCOUNT_NUMBER;

/**
 *
 * @param department {"saas" | "ai" | "scraper"}
 * @param service {string}
 * @param environment {"dev" | "beta" | "prod"}
 * @return {string}
 */
function getImageName(department, service, environment) {
    return `${department}-service-${service}-${environment === 'local' ? 'dev' : environment}`;
}

/**
 *
 * @param region {string}
 * @param department {"saas" | "ai" | "scraper"}
 * @param service {string}
 * @param environment {"dev" | "beta" | "prod"}
 * @param version {string}
 * @param shouldBuildImage {boolean}
 * @return {Promise<void>}
 */
async function buildImage({ ecrRegistry, department, service, environment, version, shouldBuildImage }) {
    console.log('Starting to build docker image...');

    const imageName = getImageName(department, service, environment);
    console.log('Image name is: ', imageName);
    const ecrRepo = `${ecrRegistry}/${imageName}`;
    console.log('ECR repo is: ', ecrRepo);

    if (shouldBuildImage) {
        await buildAndPushImage(service, ecrRepo, version)
    } else {
        await pushImage(service, ecrRepo, version)
    }   
}

async function buildAndPushImage(service, ecrRepo, version) {
    console.log('Starting to build docker image...');
    await exec.exec(`docker build -t ${service} .`)
    console.log('Image built!');

    await pushImage(service, ecrRepo, version)
}

async function pushImage(service, ecrRepo, version) {
    console.log(`Rename docker image from ${service}:latest to ${ecrRepo}:${version}`);
    await exec.exec(`docker tag ${service}:latest ${ecrRepo}:${version}`);

    console.log('Pushing to ECR...');
    await exec.exec(`docker push ${ecrRepo}:${version}`);
    console.log('Successfully pushed to ECR');
}

exports.deployToECR = async function({ ecrRegistry, version, environment, service, department, shouldBuildImage }) {
    await buildImage({ ecrRegistry, version, environment, service, department, shouldBuildImage })
}
