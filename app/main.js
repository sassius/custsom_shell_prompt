const { exit, chdir } = require("process");
const readline = require("readline");
const fs = require("fs");
const { execFileSync } = require("child_process");
const path = require("path");

//We are creating an interface for the user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: completer,
});

function completer(line) {
  const builtInCompletes = ["echo", "exit"];
  let completions = builtInCompletes.filter((c) => c.startsWith(line));

  //Attempt to check if the input is a file in the PATH
  const pathDirs = process.env.PATH.split(":");
  let externalCompletes = [];
  for (const dir of pathDirs) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.startsWith(line) && !externalCompletes.includes(file)) {
          //Complete path of the file
          const fullPath = path.join(dir, file);
          try {
            // Tries to access the file to check if it is executable
            fs.accessSync(fullPath, fs.constants.X_OK);
            externalCompletes.push(file);
          } catch (err) {}
        }
      }
    } catch (err) {}
  }

  completions = completions.concat(externalCompletes);

  //If no completions we send beeeppppp
  if (completions.length === 0) {
    process.stdout.write("\x07");
    return [[], line];
  }

  return [completions.map((c) => c + " "), line];
}

const home = process.env.HOME;

//using prompt to display the prompt message
rl.prompt();

//Special Characters
const specialCharacters = ["\\", '"', "$", "\n"];

//Function to handle Echo command
function handleEcho(input) {
  //contains the input
  let args = [];
  //Contains the current word
  let currentArg = "";

  let inSingleQuotes = false;

  let inDoubleQuotes = false;

  for (let i = 0; i < input.length; i++) {
    //Handling each character in the input
    const char = input[i];

    if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
    } else if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
    } else if (char === " " && !inSingleQuotes && !inDoubleQuotes) {
      //If we approach the end of word we treat it as a space
      if (currentArg.length > 0) {
        args.push(currentArg);

        currentArg = "";
      }
    } else {
      //For quoted backslashes
      if (char === "\\" && (inSingleQuotes || inDoubleQuotes)) {
        if (inDoubleQuotes && specialCharacters.includes(input[i + 1])) {
          currentArg += input[i + 1];
          i++;
        } else if (input[i + 1] === "\\") {
          currentArg += "\\";
          i++;
        } else {
          currentArg += char;
        }
      }
      //For unquoted backslashes
      else if (char === "\\" && !(inSingleQuotes || inDoubleQuotes)) {
        //Preserve the literal value of the next character
        currentArg += input[i + 1];
        i++;
      } else {
        //If the character is not a space or single or double quote, we add it to the current words
        currentArg += char;
      }
    }
  }

  //If the current word is not empty, we add it to the args array

  if (currentArg.length > 0) {
    args.push(currentArg);
  }

  let cmd = args[0];
  //Remove the first word from the array
  args.shift();
  //Handling Redirect Stdout (with >)
  let redirectOperator = args.includes("2>")
    ? "2>"
    : args.includes("2>>")
    ? "2>>"
    : args.includes("1>")
    ? "1>"
    : args.includes(">")
    ? ">"
    : args.includes(">>")
    ? ">>"
    : args.includes("1>>")
    ? "1>>"
    : null;

  if (redirectOperator) {
    const redirectIndex = args.indexOf(redirectOperator);
    if (redirectIndex !== -1) {
      const file = args[redirectIndex + 1];
      args = args.slice(0, redirectIndex);
      if (redirectOperator === "2>" || redirectOperator === "2>>") {
        try {
          // Ensure parent directories exist
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, "");
          // Write to stderr only, not to the file
          process.stderr.write(args.join(" ") + "\n");
        } catch (err) {
          console.error(`echo: ${file}: No such file or directory`);
        }
      } else {
        // For other redirection operators, write to the file
        // if the file exists, append to it
        if (redirectOperator === ">>" || redirectOperator === "1>>") {
          fs.createWriteStream(file, { flags: "a" }).write(
            args.join(" ") + "\n"
          );
        } else {
          // for write operators, overwrite the file
          fs.createWriteStream(file, { flags: "w" }).write(
            args.join(" ") + "\n"
          );
        }
      }
    }
  } else {
    //Print the output if no redirection is present
    console.log(args.join(" "));
  }
}

//Function to change the directory
function changeDirectory(path) {
  try {
    if (path === `~`) {
      chdir(home);
    } else {
      chdir(path);
    }
  } catch (err) {
    console.error(`cd: ${path}: No such file or directory`);
  }
}

//Function to execute the executable file (eg: ls, cat, etc)
function executeFile(input) {
  const [command, ...args] =
    input
      .match(/'[^']*'|"[^"]*"|\S+/g)
      ?.map((arg) => arg.replace(/^['"]|['"]$/g, "")) || [];
  //Handling redirect stdout (with >)

  const path = process.env.PATH.split(":");
  let valid = false;
  let redirectOperator = args.includes("2>")
    ? "2>"
    : args.includes("2>>")
    ? "2>>"
    : args.includes("1>")
    ? "1>"
    : args.includes(">")
    ? ">"
    : args.includes(">>")
    ? ">>"
    : args.includes("1>>")
    ? "1>>"
    : null;

  const redirectIndex = args.indexOf(redirectOperator);
  if (command === "cd") {
    changeDirectory(args[0]);
    return;
  }

  path.forEach((path) => {
    const commandPath = path + "/" + command;
    if (
      !valid &&
      fs.existsSync(commandPath) &&
      fs.statSync(commandPath).isFile()
    ) {
      valid = true;
      try {
        if (redirectIndex !== -1) {
          const file = args[redirectIndex + 1];

          try {
            // Execute the command and capture both stdout and stderr
            fs.mkdirSync(require("path").dirname(file), { recursive: true });
            const output = execFileSync(command, args.slice(0, redirectIndex), {
              encoding: "utf-8",
              stdio: ["ignore", "pipe", "pipe"], // Capture stdout and stderr
            });

            // Write stdout to the file (if needed)
            if (redirectOperator !== "2>" && redirectOperator !== "2>>") {
              if (redirectOperator === ">>" || redirectOperator === "1>>") {
                fs.appendFileSync(file, output);
              } else {
                fs.writeFileSync(file, output);
              }
            }
          } catch (err) {
            // If there's an error, handle stdout and stderr separately
            if (err.stdout) {
              if (redirectOperator === "2>") {
                // Write stdout to the file
                process.stderr.write(err.stdout);
              }
              // Write stdout to the file (if needed)
              else {
                if (redirectOperator === ">>" || redirectOperator === "1>>") {
                  try {
                    fs.appendFileSync(file, err.stdout);
                  } catch (err) {
                    process.stderr.write(err.stdout);
                  }
                } else {
                  fs.writeFileSync(file, err.stdout);
                }
              }
            }

            if (err.stderr) {
              if (redirectOperator === "2>") {
                // Write stderr to the file
                fs.writeFileSync(file, err.stderr);
              } else if (redirectOperator === "2>>") {
                // Append stderr to the file
                fs.appendFileSync(file, err.stderr);
              } else {
                // Print stderr to the terminal
                if (redirectOperator === ">>" || redirectOperator === "1>>") {
                  try {
                    fs.appendFileSync(file, "");
                    process.stderr.write(err.stderr);
                  } catch (err) {
                    process.stderr.write(err.stderr);
                  }
                } else {
                  process.stderr.write(err.stderr);
                }
              }
            }
          }
        } else {
          execFileSync(command, args, { encoding: "utf-8", stdio: "inherit" });
        }
      } catch (err) {
        if (err.stderr) {
          process.stderr.write(err.stderr);
        }
      }
    }
  });
  if (!valid) {
    console.log(`${command}: command not found`);
  }
}

//Function to find the path of the executable file in the PATH
const findPath = (type) => {
  const paths = process.env.PATH.split(":");
  let found = false;
  paths.forEach((path) => {
    const commandPath = path + "/" + type;
    if (!found && fs.existsSync(commandPath)) {
      console.log(`${type} is ${commandPath}`);
      found = true;
    }
  });
  if (!found) {
    console.log(`${type}: not found`);
  }
};

//Function to check the type of the command and print the result
const types = ["echo", "exit", "type", "pwd", "cd"];
const checkType = (input) => {
  const type = input.split(" ")[1];
  if (types.includes(type)) {
    console.log(`${type} is a shell builtin`);
    rl.prompt();
  } else {
    findPath(type);
    rl.prompt();
  }
};

//using the on method to listen for the line event
rl.on("line", (input) => {
  if (input.startsWith("type")) {
    checkType(input);
  } else if (input.startsWith("pwd")) {
    //Prints the current working directory for the process
    console.log(process.cwd());
    rl.prompt();
  } else if (input.startsWith("exit")) {
    //If the input starts with exit, the program will exit
    exit(0);
  }
  //Implementing the Echo command
  else if (input.includes("echo")) {
    //The echo command will print the input without the echo
    handleEcho(input);
    rl.prompt();
  } else {
    //Executes the file input that we have given the shell. Detects if it is a wrong input as well.
    executeFile(input);
    rl.prompt();
  }
});
