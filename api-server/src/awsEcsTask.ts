
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const ecs = new ECSClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    region: process.env.AWS_REGION || ''
});

const config = {
    CLUSTER: '',
    TASK: ''
};

export default async function awsECSTask(id: string, repoUrl: string, accessKeyId: string, secretAccessKey: string, region: string, cluster: string, task: string) {
    const command = new RunTaskCommand({
        cluster: cluster || config.CLUSTER,
        taskDefinition: task || config.TASK,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                assignPublicIp: 'ENABLED',
                subnets: ['', '', ''],
                securityGroups: ['']
            }
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'builder-image',
                    environment: [
                        { name: 'repoUrl', value: repoUrl },
                        { name: 'id', value: id },
                        { name: 'accessKeyId', value: accessKeyId },
                        { name: 'secretAccessKey', value: secretAccessKey },
                        { name: 'region', value: region }
                    ]
                }
            ]
        }
    });

    try {
        const result = await ecs.send(command);
        console.log("ECS Task started successfully:", result);
    } catch (error) {
        console.error("Failed to start ECS Task:", error);
        throw error;
    }
}
