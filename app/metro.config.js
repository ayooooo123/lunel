// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add txt to asset extensions for bundling text-based assets like eruda.min.txt
config.resolver.assetExts.push('txt');

module.exports = config;
