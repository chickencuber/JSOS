const s = [];
Shell.gl.draw = () => {
  Shell.gl.canvas.background(230);
  Shell.gl.canvas.fill("red");
  for (const c of s) {
    const { x, y } = c;
    Shell.gl.canvas.ellipse(x, y, 100);
  }
  const { x, y } = Shell.gl.mouse;
  Shell.gl.canvas.fill(255);
  Shell.gl.canvas.ellipse(x, y, 100);
  Shell.gl.canvas.textAlign(LEFT, TOP);
  Shell.gl.canvas.textSize(16);
  Shell.gl.canvas.fill(0);
  Shell.gl.canvas.text("press 'Q' to quit", 10, 10);
};

Shell.mouseClicked = () => {
  const { x, y } = Shell.gl.mouse;
  s.push({ x, y });
};

Shell.gl.new();

Shell.windowResized = () => {
  Shell.gl.resize();
}

return await run((r) => {
  Shell.keyPressed = (_, key) => {
    if (key === "Q") r();
  };
});
