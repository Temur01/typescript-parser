import path from "node:path";

export interface AppConfig {
  inputDir: string;
  outputDir: string;
}

export function readConfig(argv: string[]): AppConfig {
  const args = argv.slice(2);
  const input = readArg(args, "--input") ?? process.env.INPUT_DIR ?? "./export";
  const output = readArg(args, "--output") ?? process.env.OUTPUT_DIR ?? "./output";

  return {
    inputDir: path.resolve(input),
    outputDir: path.resolve(output)
  };
}

function readArg(args: string[], name: string): string | undefined {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}
