const path = args[0]?.toPath() || "/";
if(!await FS.exists(path)) {
  return "path doesn't exist";
}
const contents = await FS.getFromPath(path);
if(typeof contents !== "object") {
  return "path not a dir";
}

Shell.localVars.workingDir = path;
