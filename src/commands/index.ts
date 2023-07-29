import { initCommand, initAction } from "./init";
import { addCommand, addAction } from "./add";
import { removeCommand, removeAction } from "./remove";
import { updateCommand, updateAction } from "./update";
import { cloneCommand, cloneAction } from "./clone";
import { createCommand, createAction } from "./create";
import { linkCommand, linkAction } from "./link";
import { unlinkAction, unlinkCommand } from "./unlink";
import { openAction, openCommand } from "./open";

export const CommandFactory = {
  add: addCommand,
  clone: cloneCommand,
  create: createCommand,
  init: initCommand,
  link: linkCommand,
  unlink: unlinkCommand,
  remove: removeCommand,
  update: updateCommand,
  open: openCommand,
};

export const ActionFactory = {
  add: addAction,
  clone: cloneAction,
  create: createAction,
  init: initAction,
  link: linkAction,
  unlink: unlinkAction,
  remove: removeAction,
  update: updateAction,
  open: openAction,
};
