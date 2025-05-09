const {Store, get, set, del, clear, keys} = idbKeyval;

const FS = {
    normalizePath(path) {
        const parts = path.split("/").map(v => v.trim()).filter((v) => v !== "");
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

    async getMetaFromPath(path) {
        path = FS.normalizePath(path).join("/")          
        if(!await FS.exists(path)) {
            throw new Error("path doesn't exist")
        }
        const f = await get(path);
        if(path === "/") {
            const child = [];
            const p = FS.normalizePath(path).join("/");
            for (const k of await keys()) {
                const c = FS.normalizePath(k);
                c.pop()
                if(p === c.join("/")) {
                    child.push(k);
                }
            }
            return {contents: child, type: "dir"};

        }
        if (f.type === "dir") {
            const child = [];
            const p = FS.normalizePath(path).join("/");
            for (const k of await keys()) {
                const c = FS.normalizePath(k);
                c.pop()
                if(p === c.join("/")) {
                    child.push(k);
                }
            }
            return {contents: child, type: "dir"};
        }
        return f;
    },
    async getFromPath(path) {
        const f = await FS.getMetaFromPath(path);
        if(f.type === "symlink") {
            return await FS.getFromPath(f.path);
        }
        return f.contents;
    },

    async exists(path) {
        path = FS.normalizePath(path).join("/")
        if(path === "/") return true;
        return (await get(path)) !== undefined;
    },

    async addSymlink(path, newpath) {
        const stack = FS.normalizePath(path);
        path = stack.join("/")
        if(path === "/") throw new Error("cant do that to root dir");
        stack.pop();
        if(!await FS.exists(stack.join("/"))) {
            throw new Error("parent dir doesn't exist")
        }
        await set(path, {
            type: "symlink",
            path: newpath 
        })
    },
    async addFile(path, contents = "") {
        const stack = FS.normalizePath(path);
        path = stack.join("/")
        if(path === "/") throw new Error("cant do that to root dir");
        stack.pop();
        if(!await FS.exists(stack.join("/"))) {
            throw new Error("parent dir doesn't exist")
        }
        await set(path, {
            type: "file",
            contents: contents 
        })
    },
    async addDir(path) {
        const stack = FS.normalizePath(path);
        path = stack.join("/")
        if(path === "/") throw new Error("cant do that to root dir");
        stack.pop();
        if(!await FS.exists(stack.join("/"))) {
            throw new Error("parent dir doesn't exist")
        }
        await set(path, {
            type: "dir",
        })
    },
    async delete(path) {
        path = FS.normalizePath(path).join("/")          
        if(path === "/") throw new Error("cant do that to root dir");
        if(!await FS.exists(path)) {
            throw new Error("path doesn't exist")
        }
        const p = await FS.getMetaFromPath(path);
        if(p.type === "dir") {
            for(const k of p.contents) {
                await FS.delete(k); 
            }
        }
        await del(path);
    },
    async move (path, newPath) {
        path = FS.normalizePath(path).join("/");      
        const stack = FS.normalizePath(newPath);
        newPath = stack.join("/")
        if(path === "/" || newPath === "/") throw new Error("cant do that to root dir");
        stack.pop();
        if(!await FS.exists(stack.join("/"))) {
            throw new Error("parent dir doesn't exist")
        }
        if(!await FS.exists(path)) {
            throw new Error("path doesn't exist")
        }
        const p = await FS.getMetaFromPath(path);
        await set(newPath, p);
        await del(path);
        if(p.type === "dir") {
            for(const k of p.contents) {
                const name = FS.normalizePath(k).at(-1);
                const np = FS.normalizePath(newPath + "/" + name).join("/")
                await FS.move(k, np);
            }
        }
    },
    async copy(path, newPath) {
        path = FS.normalizePath(path).join("/");      
        const stack = FS.normalizePath(newPath);
        newPath = stack.join("/")
        if(path === "/" || newPath === "/") throw new Error("cant do that to root dir");
        stack.pop();
        if(!await FS.exists(stack.join("/"))) {
            throw new Error("parent dir doesn't exist")
        }
        if(!await FS.exists(path)) {
            throw new Error("path doesn't exist")
        }
        const p = await FS.getMetaFromPath(path);
        await set(newPath, p);
        if(p.type === "dir") {
            for(const k of p.contents) {
                const name = FS.normalizePath(k).at(-1);
                const np = FS.normalizePath(newPath + "/" + name).join("/")
                await FS.copy(k, np);
            }
        }
    }
};


async function isDbEmpty() {
    return (await keys()).length === 0
}


async function clearDB() {
    await clear() 
}
if(testing) { 
    clearDB()
}
