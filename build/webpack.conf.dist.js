'use strict';

const path = require('path');

const webpack = require('webpack');

const rootDir = path.resolve(__dirname, '..');

module.exports = {
    mode: "production",
    entry: {
        main: [ path.resolve(rootDir, 'src', 'RPGUltimate.ts') ]
    },
    output: {
        filename: 'RPGUltimate.js',
        path: path.resolve(rootDir, 'dist'),
        libraryTarget: 'commonjs2',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                enforce: 'pre',
                loader: 'tslint-loader'
            },
        ]
    },
    optimization: {
        minimize: true,
    },
    resolve: {
        extensions: [ '.ts' ],
    },
};