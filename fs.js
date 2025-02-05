const FS = {
  files: {},

  // Helper to normalize the path (handle ., ..)
  normalizePath(path) {
    const parts = path.split("/").filter((v) => v !== "");
    const stack = [];

    for (const part of parts) {
      if (part === "..") {
        // Go to the parent directory (pop the last item)
        stack.pop();
      } else if (part !== ".") {
        // Add the current directory unless it's "."
        stack.push(part);
      }
    }

    return stack;
  },

  // Traverse the normalized path and get the file/directory
  getFromPath(path) {
    const p = this.normalizePath(path);
    let inst = this.files;

    for (const part of p) {
      inst = inst[part];
      if (inst === undefined) {
        return null; // Path doesn't exist
      }
    }

    return inst;
  },

  exists(path) {
    return this.getFromPath(path) !== null;
  },

  // Add a file (assumes parent directory exists)
  addFile(path, contents = "") {
    const p = this.normalizePath(path);
    if(FS.exists("./.ip") && p.join("/") === ".ip") return;
    const name = p.pop(); // Get the file name
    const dir = this.getFromPath(p.join("/")); // Get the parent directory
    if (dir && typeof dir === "object") {
      dir[name] = contents; // Add the file to the directory
    } else {
      throw new Error(`Directory does not exist for path: ${p.join("/")}`);
    }
    localSave(this.files);
    return this;
  },

  // Add a directory (assumes parent directory exists)
  addDir(path) {
    this.addFile(path, {});
    localSave(this.files);
    return this;
  },
  delete(path) {
    const p = this.normalizePath(path);
    if(FS.exists("./.ip") && p.join("/") === ".ip") return;
    const name = p.pop(); // Get the file name
    const dir = this.getFromPath(p.join("/")); // Get the parent directory

    if (dir && typeof dir === "object") {
      delete dir[name]; // Add the file to the directory
    } else {
      throw new Error(`Directory does not exist for path: ${p.join("/")}`);
    }
    localSave(this.files);
    return this;
  },
};
