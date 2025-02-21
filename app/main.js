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
      const input = answer.slice(5).trim()
      const matches = input.match(/'([^']+)'|\S+/g) || [];

let result = [];
let temp = ""; // Temporary storage for merging adjacent quoted words
let prevWasQuoted = false;

for (let word of matches) {
    if (word.startsWith("'")) {
        let unquoted = word.replace(/'/g, ""); // Remove all single quotes

        if (prevWasQuoted) {
            temp += unquoted; // Merge adjacent quoted words
        } else {
            if (temp) result.push(temp);
            temp = unquoted;
        }

        prevWasQuoted = true;
    } else {
        if (temp) {
            result.push(temp); // Push merged quoted content
            temp = "";
        }
        result.push(word);
        prevWasQuoted = false;
    }
}

// Push the last merged quoted word if any
if (temp) result.push(temp);

console.log(result.join(" ")); // Output the final processed string
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
    else if (command=='cat'){
      if (args[0].length == 0){
        console.log("cat: missing file operand")
      }
      else{
        for(const filepath of args){
          try {
            const content = fs.readFileSync(filepath,{encoding:'utf-8'})
            process.stdout.write(content);
          }
          catch(err){
            console.log(`${filepath}: No such file or directory`)
          }
        }
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
