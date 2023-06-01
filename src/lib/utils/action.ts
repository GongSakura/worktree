import chalk from "chalk";

export function done(){
    process.stdout.write(`  ${chalk.greenBright.bold(`✔ DONE`)}\n`);
}