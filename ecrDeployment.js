const core = require('@actions/core')
const exec = require('@actions/exec');

const ACCOUNT_NUMBER = process.env.AWS_ACCOUNT_NUMBER;

/**
 *
 * @param department {"saas" | "ai"}
 * @param service {string}
 * @param environment {"dev" | "beta" | "prod"}
 * @return {string}
 */
function getImageName(department, service, environment) {
    return `${department}-service-${service}-${environment}`;
}

/**
 *
 * @param region {string}
 * @param imageName {string}
 * @return {string}
 */
function getECRRepository(region, imageName) {
    return `${ACCOUNT_NUMBER}.dkr.ecr.${region}.amazonaws.com/${imageName}`;
}

/**
 *
 * @param region {string}
 * @return {Promise<void>}
 */
async function loginToECR(region) {
    console.log('Getting login in to ECR...');
    let doLoginStdout = '';
    let doLoginStderr = '';
    const exitCode = await exec.exec(`aws ecr get-login --no-include-email --region ${region}`, [],{
        silent: true,
        listeners: {
            stdout: (data) => {
                doLoginStdout += data.toString();
            },
            stderr: (data) => {
                doLoginStderr += data.toString();
            }
        }
    })
    if (!!exitCode) {
        throw new Error('Could not login: ' + doLoginStderr);
    }
    console.log('Using credentials to login...');
    await exec.exec(doLoginStdout);
    console.log('Logged in!');
}

/**
 *
 * @param region {string}
 * @param department {"saas" | "ai"}
 * @param service {string}
 * @param environment {"dev" | "beta" | "prod"}
 * @param version {string}
 * @return {Promise<void>}
 */
async function buildImage({ region, department, service, environment, version }) {
    console.log('Starting to build docker image...');

    const imageName = getImageName(department, service, environment);
    console.log('Image name is: ', imageName);
    const ecrRepo = getECRRepository(region, imageName);
    console.log('ECR repo is: ', ecrRepo);

    await exec.exec(`docker build -t ${imageName} .`)
    console.log('Image built!');

    await exec.exec(`docker tag ${imageName}:latest ${ecrRepo}:${version}`);

    console.log('Pushing to ECR...');
    await exec.exec(`docker push ${ecrRepo}:${version}`);
    console.log('Successfully pushed to ECR');
}

exports.deployToECR = async function({ version, environment, service, department}) {
    const region = 'eu-central-1';
    await loginToECR(region);
    await buildImage({ region, version, environment, service, department })
}
