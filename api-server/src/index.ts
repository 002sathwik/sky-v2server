
import express from 'express';
import cors from 'cors';

import { createClient } from "redis";
import dotenv from 'dotenv';
import { generate } from './utils';
dotenv.config();

const publisher = createClient();
publisher.connect();

const subscriber = createClient();
subscriber.connect();


const app = express();
app.use(cors());
app.use(express.json());


app.post("/build-deploy", async (req: any, res: any) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
     

    publisher.hSet("status", id, "uploded");

    console.log("done");
    res.json({
        id: id
    })
});

app.get("/status", async (req, res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({
        status: response
    })
})

app.post("/security", async (req, res) => {
    const key = req.body.key;
    const pass = process.env.SECURITY_KEY;
    console.log(key)
    console.log(pass)
    if (key === pass) {
      res.json({
        status: "success",
      });
    } else {
      res.json({
        status: "fails",
      });
    }
  });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
}); 