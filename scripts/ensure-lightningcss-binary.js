#!/usr/bin/env node
"use strict";

/**
 * Ensures the correct LightningCSS platform binary package is installed.
 * Fixes EAS / CI failures like:
 *   Cannot find module '../lightningcss.darwin-arm64.node'
 */

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const GUARD = "ENSURE_LIGHTNINGCSS_BINARY_RAN";

function log(msg) {
  // Use stderr so it shows up in CI logs clearly.
  process.stderr.write(`${msg}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getLightningCssVersion() {
  // Avoid package "exports" problems by locating the actual installed files.
  const main = require.resolve("lightningcss");
  const pkgPath = path.resolve(path.dirname(main), "..", "package.json");
  const pkg = readJson(pkgPath);
  return pkg.version;
}

function binaryPackageFor(platform, arch) {
  // LightningCSS publishes platform-specific packages.
  // We map only what we need, but include common ones safely.
  if (platform === "darwin" && arch === "arm64") return "lightningcss-darwin-arm64";
  if (platform === "darwin" && arch === "x64") return "lightningcss-darwin-x64";

  if (platform === "linux" && arch === "x64") return "lightningcss-linux-x64-gnu";
  if (platform === "linux" && arch === "arm64") return "lightningcss-linux-arm64-gnu";

  if (platform === "win32" && arch === "x64") return "lightningcss-win32-x64-msvc";
  if (platform === "win32" && arch === "arm64") return "lightningcss-win32-arm64-msvc";

  return null;
}

function isModuleResolvable(name) {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}

function npmInstallNoSave(pkgSpec) {
  // Guard against recursive postinstall.
  const env = { ...process.env, [GUARD]: "1" };

  // --ignore-scripts prevents re-triggering install scripts.
  const args = ["install", "--no-save", "--ignore-scripts", "--no-audit", "--no-fund", pkgSpec];

  log(`📦 Installing missing dependency: npm ${args.join(" ")}`);
  cp.execFileSync("npm", args, { stdio: "inherit", env });
}

function main() {
  if (process.env[GUARD] === "1") return;

  const platform = process.platform;
  const arch = process.arch;

  // Only run where NativeWind/lightningcss is present.
  if (!isModuleResolvable("lightningcss")) {
    log("ℹ️ lightningcss not installed; skipping ensure-lightningcss-binary.");
    return;
  }

  const version = getLightningCssVersion();
  const binPkg = binaryPackageFor(platform, arch);

  if (!binPkg) {
    log(`ℹ️ No LightningCSS binary package mapping for ${platform}/${arch}; skipping.`);
    return;
  }

  if (isModuleResolvable(binPkg)) {
    log(`✅ ${binPkg} already present (v${version}).`);
    return;
  }

  // Install exact matching version to avoid ABI mismatches.
  npmInstallNoSave(`${binPkg}@${version}`);

  if (!isModuleResolvable(binPkg)) {
    throw new Error(`Failed to install ${binPkg}@${version}`);
  }

  log(`✅ Installed ${binPkg}@${version}`);
}

main();
