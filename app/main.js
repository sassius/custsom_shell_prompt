const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process"); // Import spawn correctly

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("$ ", (answer) => {
    if (answer.toLowerCase() === "exit 0") {
      rl.close();
      return;
    }

    const args = answer.trim().split(/\s+/);
    const command = args.shift();

    if (!command) {
      prompt();
      return;
    }

    if (command === "echo") {
      console.log(args.join(" "));
    } else if (command === "type") {
      const targetCommand = args[0];
      const builtIn = ["type", "echo", "exit"];

      if (builtIn.includes(targetCommand)) {
        console.log(`${targetCommand} is a shell builtin`);
      } else {
        const paths = process.env.PATH.split(path.delimiter);
        let found = false;

        for (let p of paths) {
          const fullPath = path.join(p, targetCommand);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            console.log(`${targetCommand} is ${fullPath}`);
            found = true;
            break;
          }
        }

        if (!found) {
          console.log(`${targetCommand}: not found`);
        }
      }
    } else {
      const child = spawn(command, args, { stdio: "inherit" });

      child.on("error", (err) => {
        process.stdout.write(`${command}: command not found\n`);
      });

      child.on("exit", () => {
        prompt();
      });

    }

    prompt();
  });
}

prompt();
