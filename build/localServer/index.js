"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Daemon = exports.return404 = exports.splitIpAddr = void 0;
const express_1 = __importDefault(require("express"));
const node_https_1 = require("node:https");
const node_path_1 = require("node:path");
const safe_1 = __importDefault(require("colors/safe"));
const node_util_1 = require("node:util");
const logger_1 = require("./logger");
const ip_1 = __importDefault(require("ip"));
const ver = '0.1.4';
const CoNET_SI_Network_Domain = 'openpgp.online';
const conet_DL_getSINodes = `https://${CoNET_SI_Network_Domain}:4001/api/conet-si-list`;
const postToEndpointJSON = (url, jsonData) => {
    return new Promise((resolve, reject) => {
        const Url = new URL(url);
        const option = {
            port: Url.port,
            hostname: Url.hostname,
            host: Url.host,
            path: Url.pathname,
            method: 'POST',
            protocol: Url.protocol,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': jsonData.length
            },
            rejectUnauthorized: false
        };
        const connect = (0, node_https_1.request)(option, res => {
            let data = '';
            if (res.statusCode === 200) {
                res.on('data', _data => {
                    data += _data;
                });
            }
            res.once('end', () => {
                (0, logger_1.logger)(`postToEndpoint res on END`);
                if (data.length) {
                    let ret;
                    try {
                        ret = JSON.parse(data);
                    }
                    catch (ex) {
                        (0, logger_1.logger)(safe_1.default.red(`postToEndpointJSON [${url}] JSON parse ERROR! data=\n[${data}]\n`));
                        return resolve('');
                    }
                    return resolve(ret);
                }
                return ('');
            });
            res.on('error', err => {
                (0, logger_1.logger)(safe_1.default.red(`postToEndpointJSON [${url}] response on ERROR! \n[${err.message}]\n`));
            });
        });
        connect.on('error', err => {
            (0, logger_1.logger)(safe_1.default.red(`postToEndpointJSON [${url}] connect on ERROR! \n[${err.message}]\n`));
            return reject(err);
        });
        connect.end(jsonData);
    });
};
const splitIpAddr = (ipaddress) => {
    if (!ipaddress?.length) {
        (0, logger_1.logger)(safe_1.default.red(`splitIpAddr ipaddress have no ipaddress?.length`), (0, node_util_1.inspect)(ipaddress, false, 3, true));
        return '';
    }
    const _ret = ipaddress.split(':');
    return _ret[_ret.length - 1];
};
exports.splitIpAddr = splitIpAddr;
const makeMetadata = (text) => {
    let ret = '{';
    let n = 0;
    const makeObj = (text) => {
        ret += `${n === 0 ? '' : ','}"st${n++}":"${text}"`;
    };
    while (text.length) {
        const uu = text.substring(0, 500);
        text = text.substring(500);
        makeObj(uu);
    }
    ret += '}';
    return ret;
};
const joinMetadata = (metadata) => {
    delete metadata.response;
    let _metadata = '';
    Object.keys(metadata).forEach(n => {
        _metadata += metadata[n];
    });
    metadata['text'] = _metadata;
};
const otherRespon = (body, _status) => {
    const Ranges = (_status === 200) ? 'Accept-Ranges: bytes\r\n' : '';
    const Content = (_status === 200) ? `Content-Type: text/html; charset=utf-8\r\n` : 'Content-Type: text/html\r\n';
    const headers = `Server: nginx/1.6.2\r\n`
        + `Date: ${new Date().toUTCString()}\r\n`
        + Content
        + `Content-Length: ${body.length}\r\n`
        + `Connection: keep-alive\r\n`
        + `Vary: Accept-Encoding\r\n`
        //+ `Transfer-Encoding: chunked\r\n`
        + '\r\n';
    const status = _status === 200 ? 'HTTP/1.1 200 OK\r\n' : 'HTTP/1.1 404 Not Found\r\n';
    return status + headers + body;
};
const return404 = () => {
    const kkk = '<html>\r\n<head><title>404 Not Found</title></head>\r\n<body bgcolor="white">\r\n<center><h1>404 Not Found</h1></center>\r\n<hr><center>nginx/1.6.2</center>\r\n</body>\r\n</html>\r\n';
    return otherRespon(Buffer.from(kkk), 404);
};
exports.return404 = return404;
class Daemon {
    PORT;
    reactBuildFolder;
    logsPool = [];
    loginListening = null;
    localserver;
    connect_peer_pool = [];
    appsPath = (0, node_path_1.join)(__dirname);
    worker_command_waiting_pool = new Map();
    logStram = '';
    constructor(PORT = 3000, reactBuildFolder) {
        this.PORT = PORT;
        this.reactBuildFolder = reactBuildFolder;
        this.initialize();
    }
    end() {
        this.localserver.close();
    }
    postMessageToLocalDevice(device, encryptedMessage) {
        const index = this.connect_peer_pool.findIndex(n => n.publicKeyID === device);
        if (index < 0) {
            return console.log((0, node_util_1.inspect)({ postMessageToLocalDeviceError: `this.connect_peer_pool have no publicKeyID [${device}]` }, false, 3, true));
        }
        const ws = this.connect_peer_pool[index];
        const sendData = { encryptedMessage: encryptedMessage };
        console.log((0, node_util_1.inspect)({ ws_send: sendData }, false, 3, true));
        return ws.send(JSON.stringify(sendData));
    }
    initialize = () => {
        const staticFolder = (0, node_path_1.join)(this.appsPath);
        //const launcherFolder = join ( this.appsPath, '../launcher' )
        //console.dir ({ staticFolder: staticFolder, launcherFolder: launcherFolder })
        const app = (0, express_1.default)();
        const cors = require('cors');
        app.use(cors());
        app.use(express_1.default.static(staticFolder));
        //app.use ( express.static ( launcherFolder ))
        app.use(express_1.default.json());
        app.once('error', (err) => {
            (0, logger_1.logger)(err);
            (0, logger_1.logger)(`Local server on ERROR, try restart!`);
            return this.initialize();
        });
        app.post('/postMessage', (req, res) => {
            const post_data = req.body;
            console.log((0, node_util_1.inspect)(post_data, false, 3, true));
            console.log(`unknow type of ${post_data}`);
            res.sendStatus(404);
            return res.end();
        });
        app.get('/ipaddress', (req, res) => {
            return res.json({ ip: ip_1.default.address() }).end();
        });
        app.post('/proxyusage', (req, res) => {
            res.json().end();
            (0, logger_1.logger)((0, node_util_1.inspect)(req.body.data, false, 3, true));
            this.logsPool.unshift(req.body.data);
        });
        app.post('/connecting', (req, res) => {
            const headerName = safe_1.default.blue(`Local Server /connecting remoteAddress = ${req.socket?.remoteAddress}`);
            (0, logger_1.logger)(headerName, (0, node_util_1.inspect)(req.body.data, false, 3, true));
            let roop;
            if (this.loginListening) {
                (0, logger_1.logger)(`${headerName} Double connecting. drop connecting!`);
                return res.sendStatus(403).end();
            }
            this.loginListening = res;
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders(); // flush the headers to establish SSE with client
            const interValID = () => {
                if (res.closed) {
                    this.loginListening = null;
                    return (0, logger_1.logger)(` ${headerName} lost connect! `);
                }
                res.write(`\r\n\r\n`, err => {
                    if (err) {
                        (0, logger_1.logger)(`${headerName}res.write got Error STOP connecting`, err);
                        res.end();
                        this.loginListening = null;
                    }
                    return roop = setTimeout(() => {
                        interValID();
                    }, 10000);
                });
            };
            res.once('close', () => {
                (0, logger_1.logger)(`[${headerName}] Closed`);
                res.end();
                clearTimeout(roop);
                this.loginListening = null;
            });
            res.on('error', err => {
                (0, logger_1.logger)(`[${headerName}] on Error`, err);
            });
            return interValID();
        });
        app.post('/connectingResponse', (req, res) => {
            const headerName = safe_1.default.blue(`Local Server /connectingResponse remoteAddress = ${req.socket?.remoteAddress}`);
            const data = req.body.data;
            (0, logger_1.logger)(`${headerName} connecting `, (0, node_util_1.inspect)(data));
            if (!data.uuid) {
                (0, logger_1.logger)(`${headerName} has not UUID in worker_command! STOP connecting!`, (0, node_util_1.inspect)(data));
                data.err = 'NO_UUID';
                return res.sendStatus(403).json(data);
            }
            const _res = this.worker_command_waiting_pool.get(data.uuid);
            if (!_res) {
                (0, logger_1.logger)(`${headerName} has not res STOP connecting!`, (0, node_util_1.inspect)(data));
                data.err = 'NOT_READY';
                return res.sendStatus(403).json(data);
            }
            this.worker_command_waiting_pool.delete(data.uuid);
            if (_res.closed || !_res.writable) {
                (0, logger_1.logger)(`${headerName} has not res STOP connecting!`, (0, node_util_1.inspect)(data));
                data.err = 'NOT_READY';
                return res.sendStatus(403).json(data);
            }
            res.json();
            if (data.err) {
                return _res.sendStatus(404).end();
            }
            _res.json(data);
        });
        app.get('/ver', (req, res) => {
            (0, logger_1.logger)(`APP get ${req.url}`);
            res.json({ ver });
        });
        app.all('*', (req, res) => {
            (0, logger_1.logger)(safe_1.default.red(`Local web server got unknow request URL Error! [${(0, exports.splitIpAddr)(req.ip)}] => ${req.method} url =[${req.url}]`));
            return res.status(404).end((0, exports.return404)());
        });
        this.localserver = app.listen(this.PORT, () => {
            return console.table([
                { 'CONET Local Web Server': `http://localhost:${this.PORT}, local-path = [${staticFolder}]` },
            ]);
        });
    };
}
exports.Daemon = Daemon;
