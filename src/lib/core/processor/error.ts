import { IContext } from "../../utils/types";
import { DEFAULT_ERROR_MESSAGE } from "../../utils/constants";

function captureError(context: IContext, next: CallableFunction) {
  try {
    next();
  } catch (error: any) {
    process.stderr.write(formatError(error.message));
  }
}

function formatError(message: string) {
  const indentsRegExp = new RegExp(
    `[\\n][${" \\f\\t\\v\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff"}]+`
  );
  const columns = process.stdout.isTTY ? process.stdout.columns : 40;
  let defaultError = DEFAULT_ERROR_MESSAGE;
  let appendError = addIndents(4) + "::" + addIndents(1);
  for (const s of message.trim()) {
    if (s === "\n") {
      defaultError += appendError + addNewLine(1);
      appendError = addIndents(4) + "::" + addIndents(1);
      continue;
    }
    if (appendError.length % columns === 0) {
      appendError += addNewLine(1);
      indentsRegExp.test(s)
        ? (appendError += addIndents(7))
        : (appendError += addIndents(7) + s);
    } else {
      appendError += s;
    }
  }
  return defaultError + appendError + addNewLine(1);
}

function addIndents(n: number) {
  let indents = "";
  for (let i = 0; i < n; i++) {
    indents += " ";
  }
  return indents;
}
function addNewLine(n: number) {
  let line = "";
  for (let i = 0; i < n; i++) {
    line += "\n";
  }
  return line;
}

export default {
  captureError,
};
