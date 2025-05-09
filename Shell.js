let running = false;


class Font {
    render() {}
}

async function getUserData(p = "/user") {
    if(!await FS.exists(p)) {
        return {type: "dir", contents: {}};
    }
    const c = await FS.getMetaFromPath(p)
    if(c.type !== "dir") {
        return {type: "dir", contents: {}};
    }
    const obj = {}
    for(const n of c.contents) {
        const s = await FS.getMetaFromPath(n); 
        if(s.type === "dir") {
            obj[n] = getUserData(n); 
        } else {
            obj[n] = s;
        }
    }
    c.contents = obj;
    return c;
}

async function setUserData(data, path ="/user") {
    if(data.type === "dir") {
        await FS.addDir(path);
        for(const [k, v] of Object.entries(data.contents)) {
            await setUserData(v, k); 
        }
    } else if(data.type === "symlink") {
        await FS.addSymlink(path, data.path)
    } else {
        await FS.addFile(path, data.contents)
    }
}

function getCmd() {
    return Shell.terminal
        .getLine()
        .slice(Shell.localVars.workingDir.length + 1)
        .trim();
}

Array.prototype.chunk = function (amount) {
    const arr = structuredClone(this);
    const _new = [];
    while (arr.length > 0) {
        _new.push(arr.splice(0, amount));
    }
    return _new;
};

String.prototype.chunk = function (amount) {
    return this.split("")
        .chunk(amount)
        .map((v) => v.join(""));
};

async function runShell(code, dir, args, shell) {
    const func = await shell.run("/bin/std/sh.exe");
    if (func?.constructor?.name !== "AsyncFunction") {
        await clearDB()
        location.reload();
    }
    return await func(code, dir, args, shell);
}

const last = [];

function fixCursor() {
    if (!Shell.terminal.scroll.allow) return;
    if ($("#text-cursor").rect().right > Shell.size.width) {
        Shell.terminal.scroll.x +=
            $("#text-cursor").rect().right - Shell.size.width;
    } else if ($("#text-cursor").rect().left < 0) {
        Shell.terminal.scroll.x += $("#text-cursor").rect().left;
    }
    if ($("#text-cursor").rect().bottom > Shell.size.height) {
        Shell.terminal.scroll.y +=
            $("#text-cursor").rect().bottom - Shell.size.height;
    } else if ($("#text-cursor").rect().top < 0) {
        Shell.terminal.scroll.y += $("#text-cursor").rect().top;
    }
}

function Enter() {
    return new Promise((r) => {
        const cmd = getCmd();
        Shell.terminal.cursor.x = 0;
        Shell.terminal.cursor.y++;
        if (cmd !== "") {
            last.push(cmd);
            Shell.run(cmd).then((v) => {
                clearAll();
                if (v === undefined) {
                    Shell.terminal.add(Shell.localVars.workingDir + ">");
                    r();
                    return;
                }
                Shell.terminal.add(v);
                Shell.terminal.cursor.x = 0;
                Shell.terminal.cursor.y++;
                Shell.terminal.add(Shell.localVars.workingDir + ">");
                r();
            });
        } else {
            Shell.terminal.add(Shell.localVars.workingDir + ">");
            r();
        }
    });
}

$("html")
    .on("keyup", ({ keyCode, key }) => {
        try {
            Shell.keyReleased(keyCode, key);
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    })
    .on("paste", async (e) => {
        const t = (e.clipboardData || window.clipboardData)
            .getData("text")
            .split("\n");
        let i = false;
        for (const c of t) {
            if (i && !running) await Enter();
            Shell.terminal.add(c);
            if (running) Shell.terminal.add("\n");
            i = true;
        }
    })
    .on("keydown", (event) => {
        const { keyCode, key, ctrlKey } = event;
        if (ctrlKey) {
            if (["c", "v"].includes(key)) return;
            event.preventDefault();
        }
        if (
            [TAB, UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(keyCode)
        ) {
            event.preventDefault();
        }
        if (!done) return;
        if (running) {
            try {
                Shell.keyPressed(keyCode, key);
            } catch (e) {
                Shell.terminal.add(e.toString());
                Shell.exit = true;
            }
            return;
        }
        if (ctrlKey) {
            return;
        }
        switch (keyCode) {
            case CONTROL:
            case SHIFT:
            case ALT:
            case ESCAPE:
            case 91:
            case 112:
            case 113:
            case 114:
            case 115:
            case 116:
            case 117:
            case 118:
            case 119:
            case 120:
            case 121:
            case 122:
            case 123:
                break;
            case TAB:
                Shell.terminal.add("    ");
                break;
            case LEFT_ARROW:
                if (Shell.terminal.cursor.x > Shell.localVars.workingDir.length + 1) {
                    Shell.terminal.cursor.x--;
                }
                break;
            case RIGHT_ARROW:
                Shell.terminal.cursor.x++;
            case DOWN_ARROW:
                break;
            case UP_ARROW:
                if (getCmd() === "" && last.length > 0) {
                    Shell.terminal.add(last.pop());
                }
                break;
            case ENTER:
                Enter();
                break;
            case BACKSPACE:
                if (Shell.terminal.cursor.x > Shell.localVars.workingDir.length + 1) {
                    Shell.terminal.delete();
                }
                break;
            default:
                Shell.terminal.add(key);
                break;
        }
    })
    .click(({ button }) => {
        try {
            Shell.mouseClicked([LEFT, CENTER, RIGHT][button]);
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    })
    .on("mousedown", ({ button }) => {
        try {
            Shell.mousePressed([LEFT, CENTER, RIGHT][button]);
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    })
    .on("mouseup", ({ button }) => {
        try {
            Shell.mouseReleased([LEFT, CENTER, RIGHT][button]);
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    })
    .on("drag", () => {
        try {
            Shell.mouseDragged();
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    })
    .on("mousemove", () => {
        try {
            Shell.mouseMoved();
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    })
    .on("drop", (e) => {
        e.preventDefault();
        const files = event.dataTransfer.files;

        if (files.length === 0) {
            return;
        }

        const file = files[0];

        const fileName = file.name;
        const filePath = Shell.localVars.workingDir + "/" + fileName;

        const reader = new FileReader();

        reader.onload = (e) => {
            const fileContent = e.target.result;

            FS.addFile(filePath, fileContent);
        };

        if (file.type.startsWith("text/")) {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    })
    .on("dragover", (e) => {
        e.preventDefault();
    })
    .on("contextmenu", (e) => e.preventDefault())
    .on("wheel", (e) => {
        Shell.mouseWheel(e.deltaX, e.deltaY);
    });

function windowResized() {
    try {
        Shell.windowResized();
    } catch (e) {
        Shell.terminal.add(e.toString());
        Shell.exit = true;
    }
}

class Arg {
    constructor(val) {
        this.v = val;
    }
    toPath() {
        const dir = Shell.localVars.workingDir;
        if (this.v.startsWith("/")) return "/" + FS.normalizePath(this.v).join("/");
        return "/" + FS.normalizePath(dir + "/" + this.v).join("/");
    }
    toString() {
        return this.v;
    }
}

const cache = {};

let inp = "";

const Shell = {
    localVars: {
        workingDir: "/",
    },
    reboot() {
        location.reload();
    },
    mouseWheel: () => {},
    keyPressed: () => {},
    keyReleased: () => {},
    mouseClicked: () => {},
    mouseDragged: () => {},
    mousePressed: () => {},
    mouseReleased: () => {},
    mouseMoved: () => {},
    windowResized: () => {},
    keyIsDown(...args) {
        return keyIsDown(...args);
    },
    get keyIsPressed() {
        return keyIsPressed;
    },
    get deltaTime() {
        return deltaTime;
    },
    gl: {
        canvas: false,
        ready: false,
        createGraphics: (...args) => {
            return createGraphics(...args);
        },
        _cursor: "hidden",
        get cursor_image() {
            return $("#mouse").getProp("src");
        },
        set cursor_image(v) {
            this._cursor = "custom";
            $("#mouse").props({src: v});
        },
        get cursor() {
            return this._cursor;
        },
        set cursor(v) {
            this._cursor = v;
            $("#mouse").props({src: "cursors/" + v});
        },
        fonts: {
            get JetBrainsMono() {
                return JetBrainsMono;
            },
            get GoogleSans() {
                return GoogleSans;
            },
            get Arial() {
                return "Arial";
            },
            get Courier_New() {
                return "Courier New";
            },
            get Georgia() {
                return "Georgia";
            },
            get Times_New_Roman() {
                return "Times New Roman";
            },
            get Symbols() {
                return Symbols;
            },
        },
        mouse: {
            x: 0,
            y: 0,
            get isDown() {
                return mouseIsPressed;
            },
        },
        resize() {
            this.canvas.resizeCanvas(windowWidth, windowHeight);
        },
        draw: () => {},
        setup: () => {},
        new(renderer = P2D) {
            this.canvas = createGraphics(windowWidth, windowHeight, renderer);
            $.from(this.canvas.elt).css({ display: null });
            Shell.gl.setup();
            Shell.gl.ready = true;
        },
    },
    size: {
        get width() {
            return windowWidth;
        },
        get height() {
            return windowHeight;
        },
    },
    exit: false,
    onExit: () => {},
    terminal: {
        text(v) {
            if (v !== undefined) {
                $("#terminal").text(v);
            }
            return $("#terminal").text();
        },
        color: "#ffffff",
        background: "#000000",
        scroll: {
            allow: false,
            get y() {
                return $("#scroll").elt.scrollTop;
            },
            set y(v) {
                $("#scroll").elt.scrollTop = v;
            },
            get x() {
                return $("#scroll").elt.scrollLeft;
            },
            set x(v) {
                $("#scroll").elt.scrollLeft = v;
            },
        },
        cursor: { x: 0, y: 0, style: "block" },
        getLine() {
            return this.text().split("\n")[Shell.terminal.cursor.y] || "";
        },
        clear() {
            Shell.terminal.cursor.x = 0;
            Shell.terminal.cursor.y = 0;
            $("#terminal").text("");
        },
        delete() {
            const cursor = Shell.terminal.cursor;
            const arr = $("#terminal")
                .text()
                .split("\n")
                .map((v) => v.split(""));
            while (arr.length <= cursor.y) {
                arr.push([]);
            }
            if (cursor.x === 0) {
                if (cursor.y > 0) {
                    const v = arr.splice(cursor.y, 1)[0];
                    Shell.terminal.cursor.y--;
                    Shell.terminal.cursor.x = arr[cursor.y].join("").length;
                    arr[cursor.y].push(...v);
                    $("#terminal").text(arr.map((v) => v.join("")).join("\n"));
                }
                return;
            }
            arr[cursor.y].splice(cursor.x - 1, 1);
            $("#terminal").text(arr.map((v) => v.join("")).join("\n"));
            cursor.x--;
        },
        add(str) {
            const cursor = Shell.terminal.cursor;
            const arr = $("#terminal")
                .text()
                .split("\n")
                .map((v) => v.split(""));
            while (arr.length <= cursor.y) {
                arr.push([]);
            }
            arr[cursor.y].splice(cursor.x, 0, str);
            arr[cursor.y] = arr[cursor.y].map((v) => (v === undefined ? " " : v));
            $("#terminal").text(arr.map((v) => v.join("")).join("\n"));
            cursor.x += str.length;
            cursor.y += (str.match(/\n/g) || []).length;
            if (str.endsWith("\n")) {
                cursor.x = 0;
            }
            Shell.terminal.scroll.y = $("#scroll").elt.scrollHeight;
        },
    },
    update() {
        return new Promise(async (r) => {
            const current = await FS.exists("/bin/.packages")
                ? (await FS.getFromPath("/bin/.packages"))
                .split("\n")
                .filter((v) => v !== "")
                : "";
            const userData = await getUserData();
            const startup = await FS.exists("/.startup.sh")
                ? await FS.getFromPath("/.startup.sh")
                : false;
            clearDB().then(() => {
                start(async () => {
                    await setUserData(userData);
                    if (startup) await FS.addFile("/.startup.sh", startup);
                    for (const package of current) {
                        await Shell.run(`jpm -i ${package}`);
                    }
                    this.reboot();
                    r();
                });
            })
        });
    },
    async run(command, shell = Shell) {
        running = true;
        const args = command
            .split(/(?<!\\) /gm)
            .filter((v) => v.trim() !== "")
            .map((v) => new Arg(v.replaceAll("\\ ", " ")));
        const name = args.shift().toString();
        if (name === "reset") {
            await clearDB()
            this.reboot();
            return new Promise(() => {});
        }
        if (name.startsWith("/") || name.startsWith("./")) {
            const path = new Arg(name).toPath();
            const dir = FS.normalizePath(path);
            dir.pop();
            if (await FS.exists(path)) {
                if (path.endsWith(".sh")) {
                    return await runShell(
                        await FS.getFromPath(path),
                        "/" + dir.join("/"),
                        args,
                        shell
                    );
                } else if (path.endsWith(".exe")) {
                    return await safeEval(
                        await FS.getFromPath(path),
                        "/" + dir.join("/"),
                        args,
                        shell
                    );
                }
            } else {
                return "path doesn't exist";
            }
        }
        if (await FS.exists("/cmd/" + name + ".sh")) {
            return await runShell(
                await FS.getFromPath("/cmd/" + name + ".sh"),
                "/cmd/",
                args,
                shell
            );
        } else if (await FS.exists("/cmd/" + name + ".exe")) {
            return await safeEval(
                await FS.getFromPath("/cmd/" + name + ".exe"),
                "/cmd/",
                args,
                shell
            );
        } else {
            return "command doesn't exist";
        }
    },
};

safeEval.add({
    FS,
    CONTROL: 17,
    SHIFT: 16,
    ALT: 18,
    ESCAPE: 27,
    TAB: 9,
    ENTER: 13,
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    DOWN_ARROW: 40,
    UP_ARROW: 38,
    BACKSPACE: 8,
    SUPER: 91,
    use: safeEval.fromWindow(async (win, shell, path) => {
        if (path.startsWith("~/"))
            path = win.dir + "/" + path.slice(1, path.length);
        path = new Arg(path).toPath();
        if (!(path.endsWith(".exe") || path.endsWith(".sh"))) {
            path += "/lib.exe";
        }
        path = new Arg(path).toPath();
        return await shell.run(path);
    }),
    getPath: safeEval.fromWindow((win, shell, path) => {
        if (path.startsWith("~/"))
            path = win.dir + "/" + path.slice(1, path.length);
        path = new Arg(path).toPath();
        return path;
    }),
    getFile: safeEval.fromWindow((win, shell, path) => {
        if (path.startsWith("~/"))
            path = win.dir + "/" + path.slice(1, path.length);
        path = new Arg(path).toPath();
        return FS.getFromPath(path);
    }),
    run(func = () => {}) {
        return new Promise(func);
    },
    P2D: "p2d",
    WEBGL: "webgl",
    TOP: "top",
    LEFT: "left",
    RIGHT: "right",
    BOTTOM: "bottom",
    CENTER: "center",
    CursorStyle: {
        Block: "block",
        Pipe: "pipe",
        None: "none",
    },
    random(...args) {
        return random(...args);
    },
    loadImage(...args) {
        return loadImage(...args);
    },
    Font,
});
let done = false;

function clearAll() {
    setTimeout(() => {
        Shell.keyPressed = () => {};
        Shell.keyReleased = () => {};
        Shell.mouseWheel = () => {};
        if (Shell.gl.canvas !== false) {
            Shell.gl.canvas.remove();
        }
        Shell.scroll = false;
        Shell.gl.canvas = false;
        Shell.mouseClicked = () => {};
        Shell.gl.draw = () => {};
        Shell.gl.setup = () => {};
        Shell.mouseDragged = () => {};
        Shell.mousePressed = () => {};
        Shell.mouseReleased = () => {};
        Shell.mouseMoved = () => {};
        Shell.windowResized = () => {};
        Shell.onExit = () => {};
        Shell.exit = false;
        Shell.gl.ready = false;
        running = false;
    }, 100);
}

async function start(callback = () => {}) {
    if (await isDbEmpty()) {
        await FS.addDir("cmd");
        await FS.addDir("bin");
        await FS.addDir("bin/std");
        await FS.addDir("examples");
        await FS.addDir("user");
        await FS.addFile("/bin/.packages");

        Promise.all(
            [".startup", "cmd/examples"].map(async (v) => {
                const h = await fetch(v + ".txt?cache=" + Date.now());
                const content = await h.text();
                await FS.addFile(v + ".sh", content);
            })
        ).then(() => {
            Promise.all(
                [
                    "cmd/cd",
                    "cmd/ls",
                    "cmd/cat",
                    "cmd/clear",
                    "cmd/cp",
                    "cmd/mv",
                    "cmd/rm",
                    "cmd/mkdir",
                    "cmd/touch",
                    "cmd/nano",
                    "bin/std/sh",
                    "cmd/curl",
                    "cmd/jpm",
                    "cmd/echo",
                    "examples/graphics",
                    "cmd/reboot",
                    "cmd/cursor",
                    "bin/std/lib",
                ].map(async (v) => {
                    const h = await fetch(v + ".js?cache=" + Date.now());
                    const content = await h.text();
                    await FS.addFile(v + ".exe", content);
                })
            ).then(() => {
                done = true;
                Shell.run("/.startup.sh").then((v) => {
                    callback();
                    clearAll();
                    Shell.terminal.add(Shell.localVars.workingDir + ">");
                });
            });
        });
    } else {
        done = true;
        Shell.run("/.startup.sh").then((v) => {
            callback();
            clearAll();
            Shell.terminal.add(Shell.localVars.workingDir + ">");
        });
    }
}
