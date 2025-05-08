if (!args[0]) return "expected 1 arg";
if (!FS.exists(args[0].toPath())) return "path doesn't exist";
if (flags.includes("r")) {
  const contents = await FS.getFromPath(args[0].toPath());
  if (typeof contents !== "object") return "path must be to a directory";
  Object.keys(contents).forEach(async (v) => {
    await FS.delete(args[0].toPath() + "/" + v);
  });
  return;
}

await FS.delete(args[0].toPath());
