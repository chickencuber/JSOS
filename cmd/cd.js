const path = args[0]?.toPath() || "/";
if(!FS.exists(path)) {
  return "path doesn't exist";
}
const contents = FS.getFromPath(path);
if(typeof contents !== "object") {
  return "path not a dir";
}

Shell.localVars.workingDir = path;
