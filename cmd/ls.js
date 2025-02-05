const path = args[0]?.toPath() || Shell.localVars.workingDir;
if (!FS.exists(path)) {
  return "path doesn't exist";
}
const contents = FS.getFromPath(path);
if (typeof contents === "object") {
  return Object.entries(contents)
    .filter(([k]) => !k.startsWith(".") || flags.includes("h"))
    .map(([k, v]) => (typeof v === "object" ? `dir: ${k}` : `file: ${k}`))
    .join("\n");
}
return "path not a dir";
