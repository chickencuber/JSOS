if (!args[0]) return "expected 1 argument";
const path = args[0].toPath();
if (!FS.exists(path)) {
  return "path doesn't exist";
}
const contents = FS.getFromPath(path);
if (typeof contents !== "object") {
  return contents;
}
return "path is a dir";
