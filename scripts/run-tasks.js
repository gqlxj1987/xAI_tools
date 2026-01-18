import 'dotenv/config';
import { runPipeline } from '../src/pipeline/run.js';

runPipeline(process.env, process.argv)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
