if (!args[0]) return "expected 1 argument";
const path = args[0].toPath(Shell);
if (!await FS.exists(path)) {
  return "path doesn't exist";
}
const contents = await FS.getFromPath(path);
if (typeof contents !== "object") {
  return contents;
}
return "path is a dir";
