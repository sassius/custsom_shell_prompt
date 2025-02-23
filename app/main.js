const { spawn } = require("child_process");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getCmd(answer) {
  let args = [];
  let currentArg = "";
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < answer.length; i++) {
    const char = answer[i];
    
    if(escapeNext){
      if (char===' '){
        currentArg+=" ";
      }
      else{
        currentArg+=char;
      }
    }
    else if(char=="/"){
      escapeNext=true;
    }
    else if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
    } 
    else if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
    } 
    else if (char === " " && !inSingleQuotes && !inDoubleQuotes) {
      if (currentArg.length > 0) {
        args.push(currentArg);
        currentArg = "";
      }
    } else {
      currentArg += char;
    }
  }
  if (currentArg.length > 0) {
    args.push(currentArg);
  }

  return { cmd: args[0], args: args.slice(1) };
}

function prompt() {
  rl.question("$ ", (answer) => {
    if (answer.toLowerCase() === "exit 0") {
      rl.close();
      return;
    }

    const { cmd, args } = getCmd(answer);

    if (cmd === "echo") {
      // console.log(args)
      console.log(args.join(" "));
    } else if (cmd === "type") {
      const target = args[0];
      const builtIn = ["type", "echo", "exit", "pwd", "cd"];

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
    } else if (cmd === "pwd") {
      console.log(process.cwd());
    } else if (cmd === "cd") {
      let targetPath = args[0] || process.env.HOME;
      if (targetPath === "~") {
        targetPath = process.env.HOME;
      }
      const resolvedPath = path.resolve(targetPath);
      if (
        fs.existsSync(resolvedPath) &&
        fs.statSync(resolvedPath).isDirectory()
      ) {
        try {
          process.chdir(resolvedPath);
        } catch (err) {
          console.log(`${args[0]}: No such file or directory`);
        }
      } else {
        console.log(`${args[0]}: No such file or directory`);
      }
    } else if (cmd === "cat") {
      // console.log(args);
      if (args.length === 0) {
        console.log("cat: missing file operand");
      } else {
        let output = "";
        for (let filePath of args) {
          try {
            filePath = filePath.replace(/^['"]|['"]$/g, ""); // Remove surrounding quotes
            // console.log(filePath)
            const content = fs.readFileSync(filePath, "utf-8");
            // console.log(content)
            output += content;
            // console.log(output)
          } catch (err) {
            console.log(`cat: ${filePath}: No such file or directory`);
            return;
          }
        }
        console.log(output.trim());
      }
    } else {
      const child = spawn(cmd, args, { stdio: "inherit" });
      child.on("error", () => {
        console.log(`${cmd}: command not found`);
        prompt();
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
