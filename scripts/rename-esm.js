const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

function renameJsToMjs(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      renameJsToMjs(filePath);
    } else if (file.endsWith(".js") && !file.endsWith(".d.js")) {
      const content = fs.readFileSync(filePath, "utf8");
      const mjsPath = filePath.replace(/\.js$/, ".mjs");
      fs.writeFileSync(mjsPath, content);
    }
  }
}

if (fs.existsSync(distDir)) {
  renameJsToMjs(distDir);
  console.log("ESM files created");
}
