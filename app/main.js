const { spawn } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt() {
  rl.question("$ ", (answer) => {
    if (answer.trim().toLowerCase() === "exit 0") {
      rl.close();
      return;
    }

    const parts = answer.trim().match(/(?:[^\s"]+|"[^"]*"|'[^']*')+/g) || [];
    const command = parts[0] || "";
    const args = parts.slice(1).map((arg) => arg.replace(/^['"]|['"]$/g, "")); // Remove surrounding quotes

    if (command === "echo") {
      console.log(args.join(" "));
    } else if (command === "type") {
      const target = args[0];
      const builtIn = ["type", "echo", "exit", "pwd", "cd", "cat"];

      if (builtIn.includes(target)) {
        console.log(`${target} is a shell builtin`);
      } else {
        const paths = process.env.PATH.split(path.delimiter);
        let found = false;

        for (let p of paths) {
          const fullPath = path.join(p, target);
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            console.log(`${target} is ${fullPath}`);
            found = true;
            break;
          }
        }

        if (!found) {
          console.log(`${target}: not found`);
        }
      }
    } else if (command === "pwd") {
      console.log(process.cwd());
    } else if (command === "cd") {
      let targetPath = args[0] || process.env.HOME;
      if (targetPath === "~") targetPath = process.env.HOME;

      const resolvedPath = path.resolve(targetPath);
      if (
        fs.existsSync(resolvedPath) &&
        fs.statSync(resolvedPath).isDirectory()
      ) {
        try {
          process.chdir(resolvedPath);
        } catch (err) {
          console.log(`cd: ${args[0]}: Permission denied`);
        }
      } else {
        console.log(`cd: ${args[0]}: No such file or directory`);
      }
    } else if (command === "cat") {
      if (args.length === 0) {
        console.log("cat: missing file operand");
      } else {
        for (const rawPath of args) {
          try {
            const filePath = rawPath.replace(/^['"]|['"]$/g, "");
            const content = fs.readFileSync(filePath, "utf-8");
            process.stdout.write(content);
          } catch (err) {
            console.log(`cat: ${rawPath}: No such file or directory`);
          }
        }
      }
    } else {
      const child = spawn(command, args, { stdio: "inherit" });

      child.on("error", () => {
        console.log(`${command}: command not found`);
      });

      child.on("exit", () => {
        prompt();
      });

      return;
    }

    prompt();
  });
}

prompt();
