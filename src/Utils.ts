/// <reference path="../def/node/node.d.ts" />
/// <reference path="./Contracts/RoomConfig.ts" />

import url         = require('url');
import crypto      = require('crypto');
import querystring = require('querystring');
import request     = require('request');
import http        = require('http');

export class Crypto {

    public static debug: boolean = false;

    public static urldecrypt(url_string: string, secret: string) {
        //Extract data from url
        var parsed_url = url.parse(url_string);
        var query_components : any = Crypto.parseQuery(parsed_url.query);

        if(!("data" in query_components) && !("key" in query_components))
        {
            return {};
        }

        //Extract decoded data, calculate and encode signature
        var decoded_json: string = this.base64_decode(querystring.unescape(query_components.data));
        var signature = this.base64_encode(Crypto.signString(decoded_json, secret));
        var encoded_signature = querystring.unescape(query_components.key);

        if (this.debug) {
            console.log();
            console.log("json: "+decoded_json);
            console.log("sign: "+signature);
            console.log("sign: "+encoded_signature);
        }

        //If calculated signature is valid with given signature
        if(signature == encoded_signature) {
            return JSON.parse(decoded_json);
        } else {
            throw new Error("Invalid private key");
        }
    }

    private static parseQuery(query) {
        var query_map = {};

        if (typeof query != 'string') {
            return query_map;
        }

        query.split('&').map(function(el){
            var split_at = el.indexOf('=')
            query_map[el.slice(0, split_at)] = el.slice(split_at+1)
        });

        return query_map;
    }

    public static urlencrypt(payload: any, secret: string) {
        var json_payload = JSON.stringify(payload);
        var signature = this.base64_encode(this.signString(json_payload, secret));

        var encoded_payload = this.base64_encode(json_payload);

        if (this.debug) {
            console.log();
            console.log("json: " + json_payload);
            console.log("sign: " + signature);
        }

        return "data="+encoded_payload+"&key="+signature;
    }


    public static signString(string_to_sign: string, shared_secret: string) {
        var hmac: any = crypto.createHmac('sha512', shared_secret);
        hmac.update(string_to_sign);
        hmac.end();
        return hmac.read();
    }

    private static base64_encode(data: string) {
        return new Buffer(data).toString('base64');
    }

    private static base64_decode(data: string) {
        return new Buffer(data, 'base64').toString();
    }
}

export class CallbackHandler {

    private static instance: CallbackHandler;

    private config: AppConfig;

    public static getInstance(): CallbackHandler {
        return CallbackHandler.instance;
    }

    public constructor(config: AppConfig) {
        CallbackHandler.instance = this;

        this.config = config;
    }

    public sendCallback(url: string, name: string, data: any) {
        var payload = {
            name: name,
            data: data
        };

        var urlData = Crypto.urlencrypt(payload, this.config.secure_key);
        var fullUrl = url + '?' + urlData;

        request(fullUrl, function (error, response, body) {
            if (error || response.statusCode != 200) {
                console.error(error + " " + body);
            }
        });
    }

}

export class Http {

    public static write(responce: http.ServerResponse, httpCode: number, content: string) {
        responce.writeHead(httpCode);
        responce.write(content);
        responce.end();
    }

}

export class Map<T, E> {

    private keys: T[];
    private vals: E[];

    constructor() {
        this.keys = [];
        this.vals = [];
    }

    public add(key: T, value: E) {
        if (this.containsKey(key)) {
            throw new Error("Key "+key+" allready exists");
        }

        this.keys.push(key);
        this.vals.push(value);
    }

    public get(key: T): E {
        var index = this.getKeyIndex(key);

        if (index == -1) {
            return null;
        } else {
            return this.vals[index];
        }
    }

    public remove(key: T): E {
        var index = this.getKeyIndex(key);

        if (index == -1) {
            return null;
        } else {
            var elem = this.vals[index];
            this.vals.slice(index, 1);
            this.keys.slice(index, 1);
            return elem;
        }
    }

    public containsKey(key: T): bool {
        return this.getKeyIndex(key) != -1;
    }

    public containsValue(value: E): bool {
        return this.getValueIndex(value) != -1;
    }

    public getKeyIndex(key: T): number {
        for(var i = 0; i < this.keys.length; i++) {
            if (this.keys[i] == key) {
                return i;
            }
        }

        return -1;
    }

    public getValueIndex(value: E): number {
        for(var i = 0; i < this.vals.length; i++) {
            if (this.vals[i] == value) {
                return i;
            }
        }

        return -1;
    }

    public foreachValue(callback: (key:T, val: E)=> void) {
        for (var i = 0; i < this.keys.length; i++) {
            callback(this.keys[i], this.vals[i]);
        }
    }
}