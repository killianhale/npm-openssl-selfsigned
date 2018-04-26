import * as fs from 'fs-extra';
import * as os from 'os';
import * as download from 'download';
import * as extract from 'extract-zip';
import * as Promise from 'promise';
import * as _ from 'underscore';
import * as colors from 'colors'
import { exec } from 'child_process';

var $extract = Promise.denodeify(extract);
var $exec = Promise.denodeify(exec);

export interface MessageOutputFunction {
    (message: string): void;
}

export class OpenSslOptions {
    constructor(
        isDebug?: boolean,
        summarize?: boolean,
        noWarnings?: boolean
    ) {
        this._isDebug = isDebug || false;
        this._summarize = summarize || false;
        this._noWarnings = noWarnings || false;

        this._debugFunction = (this.IsDebug)
            ? (message: string): void => { console.debug(colors.magenta(message)); }
            : (message: string): void => { };

        this._logFunction =
            (message: string): void => { console.log(message); };

        this._warnFunction = (!this.NoWarnings)
            ? (message: string): void => { console.warn(colors.yellow(message)); }
            : (message: string): void => { };

        this._errorFunction =
            (message: string): void => {
                console.error(colors.red(message));

                process.exit(1);
            };
    }

    private _isDebug: boolean;
    public get IsDebug(): boolean {
        return this._isDebug;
    }
    public set IsDebug(value: boolean) {
        this._isDebug = value;
    }

    private _noWarnings: boolean;
    public get NoWarnings(): boolean {
        return this._noWarnings;
    }
    public set NoWarnings(value: boolean) {
        this._noWarnings = value;
    }

    private _summarize: boolean;
    public get Summerize(): boolean {
        return this._summarize;
    }
    public set Summerize(value: boolean) {
        this._summarize = value;
    }

    private _debugFunction: MessageOutputFunction;
    public get DebugFunction(): MessageOutputFunction {
        return this._debugFunction;
    }
    public set DebugFunction(value: MessageOutputFunction) {
        this._debugFunction = value;
    }

    private _logFunction: MessageOutputFunction;
    public get LogFunction(): MessageOutputFunction {
        return this._logFunction;
    }
    public set LogFunction(value: MessageOutputFunction) {
        this._logFunction = value;
    }

    private _warnFunction: MessageOutputFunction;
    public get WarnFunction(): MessageOutputFunction {
        return this._warnFunction;
    }
    public set WarnFunction(value: MessageOutputFunction) {
        this._warnFunction = value;
    }

    private _errorFunction: MessageOutputFunction;
    public get ErrorFunction(): MessageOutputFunction {
        return this._errorFunction;
    }
    public set ErrorFunction(value: MessageOutputFunction) {
        this._errorFunction = value;
    }
}

export class OpenSslHelper {
    private _options: OpenSslOptions;

    private _log: MessageOutputFunction;
    private _debug: MessageOutputFunction;
    private _warn: MessageOutputFunction;
    private _error: MessageOutputFunction;

    constructor(
        options?: OpenSslOptions
    ) {
        this._options = options || new OpenSslOptions();

        this._log = this._options.LogFunction;
        this._debug = this._options.DebugFunction;
        this._warn = this._options.WarnFunction;
        this._error = this._options.ErrorFunction;
    }

    public createSelfSignedCertificate(name: string, cname: string, path: string, alt_names?: string[]): Promise<void> {
        if(!this._options.Summerize) {
            this._log(`\nCreating self-signed cert for ${cname}...`);
        }

        return new Promise<void>((resolve, reject): void => {
            this.getOpenSsl()
                .then((openssl => {
                    this.buildConfig(name, cname, path, alt_names);

                    if (!this._options.Summerize) {
                        this._log(`\tGenerating key file: '${path}/${name}.key'`);
                        this._log(`\tGenerating certificate: '${path}/${name}.crt'`);
                    }

                    let command = `${openssl} req -newkey rsa:2048 -nodes -keyout ${path}/${name}.key -x509 -days 365 -out ${path}/${name}.crt -config ${path}/${name}.conf`;

                    $exec(command)
                        .then((result: any) => {
                            if (this._options.Summerize) {
                                this._log(`Successfully created self-signed cert for ${cname}`);
                            } else {
                                this._log('\nCert created successfully!');
                            }

                            resolve()
                        })
                        .catch(reject);
                }))
                .catch(reject);
        });
    }

    public getOpenSsl(): Promise<string> {
        return new Promise<string>((resolve, reject): void => {
            if (process.platform != 'win32') {
                resolve('openssl');

                return;
            }

            let libDir = `${__dirname}/lib/openssl`;
            let exePath = `${libDir}/openssl.exe`;

            if (fs.existsSync(exePath)) {
                resolve(exePath);

                return;
            }

            if(!this._options.Summerize) {
                this._log('\tDownloading openssl...');
            }

            download('https://indy.fulgan.com/SSL/openssl-1.0.2n-x64_86-win64.zip', __dirname, { filename: 'openssl.zip' })
                .then(() => {
                    let zipFile = `${__dirname}/openssl.zip`;

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

    public buildConfig(name: string, cname: string, path: string, alt_names?: string[]): void {
        if(!this._options.Summerize) {
            this._log(`\tCreating config file '${path}/${name}.conf'`);
        }

        let $pkg = require(`${process.cwd()}/package.json`);

        let dn_parts: string[] = [];

        if ($pkg.sslDomain != undefined) {
            if ($pkg.sslDomain.country != undefined) {
                dn_parts.push(`C = ${$pkg.sslDomain.country}`);
            } else {
                this._warn('\t\tCountry is not specified in package.json!');
            }

            if ($pkg.sslDomain.state != undefined) {
                dn_parts.push(`ST = ${$pkg.sslDomain.state}`);
            } else {
                this._warn('\t\tState is not specified in package.json!');
            }

            if ($pkg.sslDomain.city != undefined) {
                dn_parts.push(`L = ${$pkg.sslDomain.city}`);
            } else {
                this._warn('\t\tCity is not specified in package.json!');
            }

            if ($pkg.sslDomain.orginization != undefined) {
                dn_parts.push(`O = ${$pkg.sslDomain.organization}`);
            } else {
                this._warn('\t\tOrganization is not specified in package.json!');
            }

            if ($pkg.sslDomain.department != undefined) {
                dn_parts.push(`OU = ${$pkg.sslDomain.department}`);
            } else {
                this._warn('\t\tDepartment is not specified in package.json!');
            }

            if ($pkg.sslDomain.email != undefined) {
                dn_parts.push(`emailAddress = ${$pkg.sslDomain.email}`);
            } else {
                this._warn('\t\tEmail Address is not specified in package.json!');
            }
        } else {
            this._warn('\nNo SSL settings found in package.json! Please run \'self-signed-cert init\'...\n');
        }

        dn_parts.push(`CN = ${cname}`);

        if (alt_names == undefined || alt_names.length == 0) {
            alt_names = this.getIpAddresses();
        }

        let alt_count = 0;
        let alt_entries = _.map(alt_names, (alt_name: string): string => {
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

        fs.writeFile(
            `${path}/${name}.conf`,
            contents,
            { flag: "w+" }
        )
    }

    private getIpAddresses(): string[] {
        let ifaces = os.networkInterfaces();

        let nics: os.NetworkInterfaceInfo[] = _.flatten(
            _.map(_.keys(ifaces), (key: string): os.NetworkInterfaceInfo[] => ifaces[key])
        );

        nics = _.filter(nics, (nic: os.NetworkInterfaceInfo): boolean => nic.family == 'IPv4');

        return _.map(nics, (nic: os.NetworkInterfaceInfo): string => nic.address);
    }
}
