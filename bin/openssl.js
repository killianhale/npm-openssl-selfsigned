"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const os = require("os");
const download = require("download");
const extract = require("extract-zip");
const Promise = require("promise");
const _ = require("underscore");
const colors = require("colors");
const child_process_1 = require("child_process");
var $extract = Promise.denodeify(extract);
var $exec = Promise.denodeify(child_process_1.exec);
class OpenSslOptions {
    constructor(isDebug, summarize, noWarnings) {
        this._isDebug = isDebug || false;
        this._summarize = summarize || false;
        this._noWarnings = noWarnings || false;
        this._debugFunction = (this.IsDebug)
            ? (message) => { console.debug(colors.magenta(message)); }
            : (message) => { };
        this._logFunction =
            (message) => { console.log(message); };
        this._warnFunction = (!this.NoWarnings)
            ? (message) => { console.warn(colors.yellow(message)); }
            : (message) => { };
        this._errorFunction =
            (message) => {
                console.error(colors.red(message));
                process.exit(1);
            };
    }
    get IsDebug() {
        return this._isDebug;
    }
    get NoWarnings() {
        return this._noWarnings;
    }
    get Summerize() {
        return this._summarize;
    }
    get DebugFunction() {
        return this._debugFunction;
    }
    set DebugFunction(value) {
        this._debugFunction = value;
    }
    get LogFunction() {
        return this._logFunction;
    }
    set LogFunction(value) {
        this._logFunction = value;
    }
    get WarnFunction() {
        return this._warnFunction;
    }
    set WarnFunction(value) {
        this._warnFunction = value;
    }
    get ErrorFunction() {
        return this._errorFunction;
    }
    set ErrorFunction(value) {
        this._errorFunction = value;
    }
}
exports.OpenSslOptions = OpenSslOptions;
class OpenSslHelper {
    constructor(options) {
        this._options = options || new OpenSslOptions();
        this._log = this._options.LogFunction;
        this._debug = this._options.DebugFunction;
        this._warn = this._options.WarnFunction;
        this._error = this._options.ErrorFunction;
    }
    createSelfSignedCertificate(name, cname, path, alt_names) {
        if (!this._options.Summerize) {
            this._log(`\nCreating self-signed cert for ${cname}...`);
        }
        return new Promise((resolve, reject) => {
            this.getOpenSsl(path)
                .then((openssl => {
                this.buildConfig(name, cname, path, alt_names);
                if (!this._options.Summerize) {
                    this._log(`\tGenerating key file: '${path}/${name}.key'`);
                    this._log(`\tGenerating certificate: '${path}/${name}.crt'`);
                }
                let command = `${openssl} req -newkey rsa:2048 -nodes -keyout ${path}/${name}.key -x509 -days 365 -out ${path}/${name}.crt -config ${path}/${name}.conf`;
                $exec(command)
                    .then((result) => {
                    if (this._options.Summerize) {
                        this._log(`Successfully created self-signed cert for ${cname}`);
                    }
                    else {
                        this._log('\nCert created successfully!');
                    }
                    resolve();
                })
                    .catch((error) => {
                    this._error(error);
                    reject(error);
                });
            }))
                .catch(reject);
        });
    }
    getOpenSsl(path) {
        return new Promise((resolve, reject) => {
            if (process.platform != 'win32') {
                resolve('openssl');
                return;
            }
            let libDir = `${path}/lib/openssl`;
            let exePath = `${libDir}/openssl.exe`;
            if (fs.existsSync(exePath)) {
                resolve(exePath);
                return;
            }
            if (!this._options.Summerize) {
                this._log('\tDownloading openssl...');
            }
            download('https://indy.fulgan.com/SSL/openssl-1.0.2n-x64_86-win64.zip', path, { filename: 'openssl.zip' })
                .then(() => {
                let zipFile = `${path}/openssl.zip`;
                $extract('openssl.zip', { dir: libDir })
                    .then(() => {
                    fs.removeSync(zipFile);
                    resolve(exePath);
                })
                    .catch(reject);
            })
                .catch(reject);
        });
    }
    buildConfig(name, cname, path, alt_names) {
        if (!this._options.Summerize) {
            this._log(`\tCreating config file '${path}/${name}.conf'`);
        }
        let $pkg = require(`${process.cwd()}/package.json`);
        let dn_parts = [];
        if ($pkg.sslDomain != undefined) {
            if ($pkg.sslDomain.country != undefined) {
                dn_parts.push(`C = ${$pkg.sslDomain.country}`);
            }
            else {
                this._warn('\t\tCountry is not specified in package.json!');
            }
            if ($pkg.sslDomain.state != undefined) {
                dn_parts.push(`ST = ${$pkg.sslDomain.state}`);
            }
            else {
                this._warn('\t\tState is not specified in package.json!');
            }
            if ($pkg.sslDomain.city != undefined) {
                dn_parts.push(`L = ${$pkg.sslDomain.city}`);
            }
            else {
                this._warn('\t\tCity is not specified in package.json!');
            }
            if ($pkg.sslDomain.organization != undefined) {
                dn_parts.push(`O = ${$pkg.sslDomain.organization}`);
            }
            else {
                this._warn('\t\tOrganization is not specified in package.json!');
            }
            if ($pkg.sslDomain.department != undefined) {
                dn_parts.push(`OU = ${$pkg.sslDomain.department}`);
            }
            else {
                this._warn('\t\tDepartment is not specified in package.json!');
            }
            if ($pkg.sslDomain.email != undefined) {
                dn_parts.push(`emailAddress = ${$pkg.sslDomain.email}`);
            }
            else {
                this._warn('\t\tEmail Address is not specified in package.json!');
            }
        }
        else {
            this._warn('\nNo SSL settings found in package.json!\n');
        }
        dn_parts.push(`CN = ${cname}`);
        if (alt_names == undefined || alt_names.length == 0) {
            alt_names = this.getIpAddresses();
        }
        let alt_count = 0;
        let alt_entries = _.map(alt_names, (alt_name) => {
            alt_count++;
            return `DNS.${alt_count} = ${alt_name}`;
        });
        let contents = `[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn

[dn]
${dn_parts.join('\n')}

[v3_req]
subjectAltName = @alt_names

[alt_names]
${alt_entries.join('\n')}
        `;
        fs.ensureDirSync(path);
        //fs.ensureDirSync(path.substring(0, path.lastIndexOf('/')));
        fs.writeFile(`${path}/${name}.conf`, contents, { flag: "w+" });
    }
    getIpAddresses() {
        let ifaces = os.networkInterfaces();
        let nics = _.flatten(_.map(_.keys(ifaces), (key) => ifaces[key]));
        nics = _.filter(nics, (nic) => nic.family == 'IPv4');
        return _.map(nics, (nic) => nic.address);
    }
}
exports.OpenSslHelper = OpenSslHelper;
//# sourceMappingURL=openssl.js.map