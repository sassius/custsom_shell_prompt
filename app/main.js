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
    if (answer.toLowerCase() == 'exit 0'){
      rl.close();
    }
    else if(answer.startsWith("echo ")){
      console.log(answer.slice(5))
      prompt();
    }
    else if (answer.startsWith("type ")){
      const builtIn =["type","echo","exit"]
      if (builtIn.includes(answer.slice(5))){
        console.log(`${answer.slice(5)} is a shell builtin`)
      }
      else if(answer.slice(5)=='ls'){
        fs.readdir(".", (err, files) => {  // "." means current directory
        if (err) console.log("Error reading directory");
        else console.log(files.join("\n")); // Print files line by line
        prompt();
        });
      }
      else(
        console.log(`${answer.slice(5)}: not found`)
      )
      prompt();
    }
    else {
      console.log(`${answer}: command not found`)
      prompt();
    }
  
  });
}
prompt();