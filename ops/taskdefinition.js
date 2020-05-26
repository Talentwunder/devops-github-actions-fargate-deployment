module.exports = function(environment, version) {
    return {
        requiresCompatibilities: ["FARGATE"],
        containerDefinitions: [
            {
                name: `saas-service-organization-${environment}-container`,
                image: `518986006376.dkr.ecr.eu-central-1.amazonaws.com/saas-service-organization-${environment}:${version}`,
                essential: true,
                portMappings: [
                    {
                        containerPort: "8080",
                        protocol: "tcp"
                    }
                ],
                logConfiguration: {
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": `saas-service-organization-${environment}`,
                        "awslogs-region": "eu-central-1",
                        "awslogs-stream-prefix": version,
                        "awslogs-create-group": "true",
                        "awslogs-datetime-format": "%H:%M:%S%L"
                    }
                },
                secrets: [
                    {
                        name: "SENTRY_DSN",
                        valueFrom:
                            "arn:aws:ssm:eu-central-1:518986006376:parameter/saas-organization-sentry-dsn"
                    },
                    {
                        name: "DB_URL",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-rds-url-${environment}`
                    },
                    {
                        name: "DB_USERNAME",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-rds-username-${environment}`
                    },
                    {
                        name: "DB_PASSWORD",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-rds-password-${environment}`
                    },
                    {
                        name: "TW_FRONTEND_URL",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-frontend-url-${environment}`
                    },
                    {
                        name: "AUTH_JWKS_URI",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-keycloak-jwks-uri-${environment}`
                    },
                    {
                        name: "LITMOS_API_KEY",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-litmos-api-key-${environment}`
                    },
                    {
                        name: "KEYCLOAK_CLIENT_SECRET",
                        valueFrom: `arn:aws:ssm:eu-central-1:518986006376:parameter/saas-keycloak-clientSecret-${environment}`
                    }
                ],
                environment: [
                    {
                        name: "TW_ENV",
                        value: environment
                    },
                    {
                        name: "AUTH_HOST",
                        value: `http://auth.saas-${environment}:8080`
                    },
                    {
                        name: "SNS_TOPIC_ARN",
                        value: `arn:aws:sns:eu-central-1:518986006376:saas-organization-${environment}`
                    },
                ]
            }
        ],
        volumes: [],
        networkMode: "awsvpc",
        memory: getMemory(environment),
        cpu: getCPU(environment),
        executionRoleArn: "arn:aws:iam::518986006376:role/ecsTaskExecutionRole",
        family: `saas-service-organization-task-${environment}`,
        taskRoleArn: "arn:aws:iam::518986006376:role/saas-service-task-role"
    };
};

function getMemory(environment) {
    const mapper = {
        dev: "512",
        beta: "512",
        prod: "4096"
    };
    return mapper[environment];
}

function getCPU(environment) {
    const mapper = {
        dev: "256",
        beta: "256",
        prod: "2048"
    };
    return mapper[environment];
}
