const readline = require("readline");

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
      const builtIn =["type","echo","exit 0"]
      if (builtIn.includes(answer.slice(5))){
        console.log(`${answer.slice(5)} is a shell builtin`)
      }
      prompt();
    }
    else {
      console.log(`${answer}: command not found`)
      prompt();
    }
  
  });
}
prompt();