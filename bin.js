"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openssl_1 = require("./openssl");
const cli_helper_1 = require("./cli-helper");
var cli = new cli_helper_1.CliHelper();
cli.registerFileCommand('create', 'create a self-signed certificate', (certName, cname, path, alt_names, options) => {
    let openssl = new openssl_1.OpenSslHelper(options);
    openssl.createSelfSignedCertificate(certName, cname, path, alt_names);
});
cli.process();
//# sourceMappingURL=bin.js.map