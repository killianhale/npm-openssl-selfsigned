import * as Promise from 'promise';
export interface MessageOutputFunction {
    (message: string): void;
}
export declare class OpenSslOptions {
    constructor(isDebug?: boolean, summarize?: boolean, noWarnings?: boolean);
    private _isDebug;
    IsDebug: boolean;
    private _noWarnings;
    NoWarnings: boolean;
    private _summarize;
    Summerize: boolean;
    private _debugFunction;
    DebugFunction: MessageOutputFunction;
    private _logFunction;
    LogFunction: MessageOutputFunction;
    private _warnFunction;
    WarnFunction: MessageOutputFunction;
    private _errorFunction;
    ErrorFunction: MessageOutputFunction;
}
export declare class OpenSslHelper {
    private _options;
    private _log;
    private _debug;
    private _warn;
    private _error;
    constructor(options?: OpenSslOptions);
    createSelfSignedCertificate(name: string, cname: string, path: string, alt_names?: string[]): Promise<void>;
    getOpenSsl(path: string): Promise<string>;
    buildConfig(name: string, cname: string, path: string, alt_names?: string[]): void;
    private getIpAddresses();
}
