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
    else {
      console.log(`${answer}: command not found`)
      prompt();
    }
  
  });
}
prompt();