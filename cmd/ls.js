const path = args[0]?.toPath(Shell) || Shell.localVars.workingDir;
if (!await FS.exists(path)) {
  return "path doesn't exist";
}
async function print(path) {
    const type = (await FS.getMetaFromPath(path)).type;
    const name = FS.normalizePath(path).at(-1);
    if(type === "dir" ) {
        return "dir: " + name + "/"
    } else if (type === "symlink") {
        return "symlink: " + name;
    } else {
        return "file: " + name;
    }
}
const contents = await FS.getMetaFromPath(path);
if (contents.type === "dir") {
  return (await Promise.all(contents.contents
    .filter((k) => !k.slice(1).startsWith(".") || flags.includes("h"))
    .map(async (k) => await print(k))))
    .join("\n");
}
return "path not a dir";
