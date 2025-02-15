const readline = require("readline");
const fs = require("fs");
const path = require("path")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Uncomment this block to pass the first stage
function prompt(){
  rl.question("$ ", (answer) => {
    if (answer.toLowerCase() === "exit 0") {
      rl.close();
      return;
    }

    if (answer.startsWith("echo ")) {
      console.log(answer.slice(5));
    } else if (answer.startsWith("type ")) {
      const command = answer.slice(5);
      const builtIn = ["type", "echo", "exit"];

      if (builtIn.includes(command)) {
        console.log(`${command} is a shell builtin`);
      } else {
        const paths = process.env.PATH.split(path.delimiter);
        let found = false;

        for (let p of paths) {
          const fullPath = path.join(p, command);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            console.log(`${command} is ${fullPath}`);
            found = true;
            break; // Stop after finding the first valid executable
          }
        }

        if (!found) {
          console.log(`${command}: not found`);
        }
      }
    } else {
      console.log(`${answer}: command not found`);
    }

    prompt();
  });
}
prompt();