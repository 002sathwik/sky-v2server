import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { S3 } from "aws-sdk";
import simpleGit from 'simple-git';

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIA6ODU45YJZGKW26E4',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'ivzIRXGhi3TTEM5G3JamI6O2YhoCsG9U7emXNVJ',
  region:"ap-south-1"

  
});

function buildProject(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Building project with id: ${id}`);
    const outputPath = path.join(__dirname, `output/${id}`);
    const child = exec(`cd ${outputPath} && npm install && npm run build`);

    child.stdout?.on("data", (data) => {
      console.log("stdout: " + data);
    });

    child.stderr?.on("data", (data) => {
      console.error("stderr: " + data);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Build process exited with code ${code}`));
      }
      resolve(void 0);
    });
  });
}


async function uploadBuildToS3(id: string) {
  console.error(`Uploding: ${id}`);
  const buildFolderPath = path.join(__dirname, `output/${id}/build`);
  const distFolderPath = path.join(__dirname, `output/${id}/dist`);
  
  let folderPath: string;
  if (fs.existsSync(buildFolderPath)) {
    folderPath = buildFolderPath;
  } else if (fs.existsSync(distFolderPath)) {
    folderPath = distFolderPath;
  } else {
    console.error(`Neither build nor dist folder exists for id: ${id}`);
    return;
  }

  const allFiles = getAllFiles(folderPath);
  for (const file of allFiles) {
    const s3Key = `dist/${id}/` + file.slice(folderPath.length + 1).replace(/\\/g, '/');
    await uploadFile(s3Key, file);
  }
}


const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];
  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach(file => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
}


const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.createReadStream(localFilePath);
  const response = await s3.upload({
    Body: fileContent,
    Bucket: "skylauncher",
    Key: fileName,
  }).promise();
  console.log("Uploaded:", response.Location);
}

const repoUrl = process.env.REPO_URL || 'https://github.com/002sathwik/counter.git'
const id = process.env.ID ;
async function init(): Promise<void> {
  
  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

  await buildProject(id);

  await uploadBuildToS3(id);

  console.log("Build and upload complete.");
}


export function generate() {
  const subset = "123456789qwertyuiopasdfghjklzxcvbnm";
  const length = 5;
  let id = "";
  for (let i = 0; i < length; i++) {
      id += subset[Math.floor(Math.random() * subset.length)];
  }
  return id;
}

init().catch((error) => {
  console.error("Initialization error:", error);
});

