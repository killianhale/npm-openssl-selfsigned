#!/usr/bin/env node

import { OpenSslHelper, OpenSslOptions } from './openssl';
import { CliHelper } from './cli-helper';

var cli = new CliHelper();

cli.registerFileCommand('create','create a self-signed certificate', 
    (certName: string, cname: string, path: string, alt_names?: string[], options?: OpenSslOptions): void => {
        let openssl = new OpenSslHelper(options);

        openssl.createSelfSignedCertificate(certName, cname, path, alt_names);
    });

cli.process();
