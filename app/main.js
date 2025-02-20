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
    if (answer.toLowerCase() === "exit 0") {
      rl.close();
      return;
    }

    const parts = answer.trim().split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    if (command === "echo") {
      console.log(args.join(" "));
    } 
    else if (command === "type") {
      const target = args[0];
      const builtIn = ["type", "echo", "exit" , "pwd" ,"cd"];

      if (builtIn.includes(target)) {
        console.log(`${target} is a shell builtin`);
      } 
      else {
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
    }
    else if(command == "pwd"){
      console.log(process.cwd());
    } 
    else if (command == "cd"){
      let targetpath = args[0] || process.env.HOME;
      if (targetpath=="~"){
        targetpath=process.env.HOME;
      }
      const resolvedpath = path.resolve(targetpath);
      if (fs.existsSync(resolvedpath) && fs.statSync(resolvedpath).isDirectory()){
        try {
          process.chdir(resolvedpath);
        } 
        catch (err) {
          console.log(`${args[0]}: No such file or directory`);
        }
      }
      else{
        console.log(`${args[0]}: No such file or directory`)
      }

    }
    else {
      
      const child = spawn(command, args, { stdio: "inherit" });

      child.on("error", () => {
        console.log(`${command}: command not found`);
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
