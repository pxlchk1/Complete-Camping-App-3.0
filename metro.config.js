/* metro.config.js */
"use strict";

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// More reliable in CI / EAS where Watchman may not be available.
config.resolver.useWatchman = false;

/**
 * IMPORTANT:
 * - If your global.css is NOT at the repo root, change this path.
 *   Example: { input: "./src/styles/global.css" }
 */
module.exports = withNativeWind(config, { input: "./global.css" });
