"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hexDebug = exports.loggerToStream = exports.logger = void 0;
const hexdump_nodejs_1 = __importDefault(require("hexdump-nodejs"));
const safe_1 = __importDefault(require("colors/safe"));
const logger = (...argv) => {
    const date = new Date();
    const dateStrang = `%c [CONET-worker INFO ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`;
    return console.log(dateStrang, 'color: #dcde56', ...argv);
};
exports.logger = logger;
const loggerToStream = (logStream, ...argv) => {
    const date = new Date();
    logStream += `Proxy [${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}] ${[...argv]}`;
};
exports.loggerToStream = loggerToStream;
const hexDebug = (buffer, length = 256) => {
    console.log(safe_1.default.underline(safe_1.default.green(`TOTAL LENGTH [${buffer.length}]`)));
    console.log(safe_1.default.grey((0, hexdump_nodejs_1.default)(buffer.slice(0, length))));
};
exports.hexDebug = hexDebug;
