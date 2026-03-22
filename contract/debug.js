const util = require('util');
const exec = util.promisify(require('child_process').exec);
async function run() {
  try {
    const { stdout, stderr } = await exec('npx hardhat test');
    console.log("SUCCESS STDOUT:\\n", stdout);
  } catch (e) {
    console.log("FAIL STDERR:\\n", e.stderr);
    console.log("FAIL STDOUT:\\n", e.stdout);
  }
}
run();
