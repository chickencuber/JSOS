if (!args[0]) return "expected 1 argument";
const path = args[0].toPath();
Shell.terminal.scroll.allow = true;

let content = "";

if (FS.exists(path)) {
  if (typeof FS.getFromPath(path) === "object") {
    return "path can't be a dir";
  } else {
    content = FS.getFromPath(path);
  }
}

Shell.terminal.clear();

Shell.terminal.add(content);
Shell.terminal.cursor.x = 0;
Shell.terminal.cursor.y = 0;

return await run((r) => {
  function Ctrl(key) {
    switch (key) {
      case "s":
        FS.addFile(path, Shell.terminal.text());
        break;
      case "x":
        Shell.terminal.clear();
        r();
        break;
    }
  }
  function Normal(key, keyCode) {
    switch (keyCode) {
      case CONTROL:
        ctrl = true;
        break;
      case SHIFT:
      case ALT:
        break;
      case TAB:
        Shell.terminal.add("    ");
        break;
      case SUPER:
        break;
      case BACKSPACE:
        Shell.terminal.delete();
        break;
      case ENTER:
        Shell.terminal.add("\n");
        break;
      case LEFT_ARROW:
        if (Shell.terminal.cursor.x > 0) Shell.terminal.cursor.x--;
        break;
      case RIGHT_ARROW:
        Shell.terminal.cursor.x++;
        break;
      case UP_ARROW:
        if (Shell.terminal.cursor.y > 0) Shell.terminal.cursor.y--;
        break;
      case DOWN_ARROW:
        Shell.terminal.cursor.y++;
        break;
      default:
        Shell.terminal.add(key);
        break;
    }
  }
  let ctrl = false;
  Shell.keyPressed = (keyCode, key) => {
    if (ctrl) {
      Ctrl(key, keyCode);
    } else {
      Normal(key, keyCode);
    }
  };
  Shell.keyReleased = (keyCode) => {
    if (keyCode === CONTROL) {
      ctrl = false;
    }
  };
});
