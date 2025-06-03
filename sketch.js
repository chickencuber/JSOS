let JetBrainsMono, GoogleSans, Symbols;

function preload() {
    p5.disableFriendlyErrors = true;
    JetBrainsMono = loadFont("JetBrainsMonoNerdFontMono-Regular.ttf");
    GoogleSans = loadFont("GoogleSans-Regular.ttf");
    Symbols = loadFont("NotoSansSymbols2-Regular.ttf");
    const c = createGraphics;
    window.createGraphics = (...args) => {
        const temp = c(...args);
        temp._text = temp.text;
        temp.text = function (text, x, y, maxWidth, maxHeight) {
            if (this.textFont() instanceof Font) {
                this.textFont().render(text, x, y);
            } else {
                this._text(text, x, y, maxWidth, maxHeight);
            }
        };
        return temp;
    };
}

function setup() {
    noCanvas();
    Shell.gl.cursor = "arrow";
    start();
}

function mousePressed() {
    fullscreen(true);
    $("html").elt.requestPointerLock();
    navigator.keyboard.lock();
}

const styles = {
    block: {
        width: null,
        display: null,
    },
    pipe: {
        width: "2px",
        display: null,
    },
    none: {
        display: "none",
    },
};

let x = 0, y = 0;

function moveMouse() {
    if(Shell.gl.mouse.x < 0) {
        Shell.gl.mouse.x = 0;
    } else if(Shell.gl.mouse.x > windowWidth) {
        Shell.gl.mouse.x = windowWidth;
    }
    if(Shell.gl.mouse.y < 0) {
        Shell.gl.mouse.y = 0;
    } else if(Shell.gl.mouse.y > windowHeight) {
        Shell.gl.mouse.y = windowHeight;
    }
    $("#mouse").css({
        top: (Shell.gl.mouse.y - 10) + "px",
        left: (Shell.gl.mouse.x - 10) + "px",
    });
}

function mouseDragged() {
    if(!document.pointerLockElement) return;
    Shell.gl.mouse.x += movedX;
    Shell.gl.mouse.y += movedY;
    moveMouse();
}

function mouseMoved() {
    if(!document.pointerLockElement) return;
    Shell.gl.mouse.x += movedX;
    Shell.gl.mouse.y += movedY;
    moveMouse();
}

function draw() {
    moveMouse();
    const cursor = Shell.terminal.cursor;
    $("#text-cursor")
        .css({
            left: `${cursor.x * 13.203125}px`,
            top: `${cursor.y * 29}px`,
                 })
    switch (cursor.style) {
        case "block":
            {
                $("#text-cursor")
                .css({
                    ...styles.block
                })
                .text(
                    (() => {
                        const txt = $("#terminal").text().split("\n");
                        if (txt[cursor.y]) {
                            return txt[cursor.y][cursor.x] || "";
                        }
                        return "";
                    })()
                );
            }
            break;
        case "pipe":
            {
                $("#text-cursor")
                .css({
                    ...styles.pipe
                })
                .text("");
            }
            break;
        case "none":
            {
                $("#text-cursor").css({
                    ...styles.none,
                });
            }
            break;
        default:
            cursor.style = "block";
            break;
    }
    if (Shell.gl.ready) {
        try {
            Shell.gl.draw();
        } catch (e) {
            Shell.terminal.add(e.toString());
            Shell.exit = true;
        }
    }
    fixCursor();
}
