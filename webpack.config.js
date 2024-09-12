/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
'use strict';

//@ts-check
/** @typedef {import('webpack').Configuration} Configuration **/

const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

/**
 * webExtensionConfig: webpack configuration function
 *
 * @param {Record<string, string>} env
 * @param {Record<string, string>} argv
 * @returns {Configuration}
 */
const webExtensionConfig = (env, argv) => ({
    mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: env['wdio'] ? 'node' : 'webworker', // extensions run in a webworker context
    cache: {
        type: 'filesystem',
        name: argv.mode + '-wdio_' + env['wdio'] + '-coverage_' + env['coverage'],
        version: '1',
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist', env['wdio'] ? 'desktop' : 'web'),
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../../[resource-path]',
    },
    resolve: {
        mainFields: env['wdio'] ? ['module', 'main'] : ['browser', 'module', 'main'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'], // support ts-files and js-files
        alias: {
            // provides alternate implementation for node module and source files
        },
        fallback: env['wdio']
            ? {}
            : {
                  // Webpack 5 no longer polyfills Node.js core modules automatically.
                  // see https://webpack.js.org/configuration/resolve/#resolvefallback
                  // for the list of Node.js core module polyfills.
                  assert: require.resolve('assert'),
                  'process/browser': require.resolve('process/browser'),
              },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
        ],
    },
    plugins: [
        new ESLintPlugin(),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1, // disable chunks by default since web extensions must be a single bundle
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser', // provide a shim for the global `process` variable
        }),
        new webpack.DefinePlugin({
            'process.env.TESTING': JSON.stringify(env['wdio'] || false),
            'process.env.COVERAGE': JSON.stringify(env['coverage'] || false),
        }),
    ],
    externals: {
        vscode: 'commonjs vscode', // ignored because it doesn't exist
    },
    performance: {
        hints: false,
    },
    devtool: 'nosources-source-map', // create a source map that points to the original source file
    infrastructureLogging: {
        level: 'log', // enables logging required for problem matchers
    },
});

module.exports = [webExtensionConfig];
