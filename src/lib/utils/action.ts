import { DEFAULT_DONE_MESSAGE } from "./constants";

export function done() {
  process.stdout.write(DEFAULT_DONE_MESSAGE);
}
