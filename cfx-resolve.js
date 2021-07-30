"use strict";

let STATIC = {
    CFX: "https://cfx.re/join/",
    IP_API: "http://ip-api.com/json/",
    CORS_API: "http://cors-anywhere.herokuapp.com/"
}

const isBrowser = () => typeof window !== "undefined";

if(isBrowser()) {
    STATIC.CFX = STATIC.CORS_API+STATIC.CFX;
}

async function req(url) {
    const options = {
        mode: "cors",
        headers: {
            "Access-Control-Allow-Origin": "*",
            "origin": url
        }
    };
    let response;
    if(typeof fetch != "function") {
        const fetch = require("node-fetch");
        response = await fetch(url, options)
    } else {
        response = await fetch(url, options)
    }
    return response;
}

async function resolve(token, options) {
    const data = {};
    if(!token) throw new Error("Specify an CFX token");
    if(options && typeof options != "object") throw new Error("Options type should be object");
    if(typeof token == "string") {
        const request = await req(STATIC.CFX+token);
        if(!request) throw new Error("An error occurred while handle request");
        const host = request.headers.get("x-citizenfx-url");
        if(!host) throw new Error("Host not found");
        if(host.includes("users.cfx.re")) throw new Error("An error occurred while resolve host");
        data.host = host.match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g)[0];
        data.ip = host.match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g)[0].split(":")[0];
        data.port = host.match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g)[0].split(":")[1];
        data.links = {
            "info": host+"info.json",
            "players": host+"players.json",
            "dynamic": host+"dynamic.json"
        }
        if(options && options.geo) {
            let geo = await req(STATIC.IP_API+data.ip);
            geo = await geo.json();
            if(geo.status == "success") {
                data.geo = {
                    "country": geo.country,
                    "countryCode": geo.countryCode,
                    "region": geo.regionName,
                    "city": geo.city,
                    "timezone": geo.timezone,
                    "isp": geo.isp,
                    "org": geo.org,
                    "as": geo.as,
                }
            } else {
                data.geo = "An error occurred while fetch geo";
            }
        }
        if(options && options.info) {
            let info = await req("http://"+data.ip+":"+data.port+"/info.json");
            info = await info.json();
            let dynamic = await req("http://"+data.ip+":"+data.port+"/dynamic.json");
            dynamic = await dynamic.json();
            data.info = {
                "hostname": (dynamic.hostname ? dynamic.hostname : "Not Provided"),
                "online": (dynamic.clients ? dynamic.clients : 0) + "/" + (dynamic.sv_maxclients ? dynamic.sv_maxclients : "0"),
                "map": (dynamic.mapname && dynamic.mapname.length >= 2 ? dynamic.mapname : "Not Provided"),
                "type": (dynamic.gametype ? dynamic.gametype : "Not Provided"),
                "server": (info.server ? info.server : "Not Provided"),
                "version": info.version,
                "icon": info.icon,
                "enhancedHostSupport": info.enhancedHostSupport,
                "vars": info.vars,
                "resources": info.resources,
            }
        }
        if(options && options.players) {
            let players = await req("http://"+data.ip+":"+data.port+"/players.json");
            players = await players.json();
            if(typeof players == "object") {
                data.players = players;
            } else {
                data.players = "An error occurred while fetch players";
            }
            
        }
        return data;
    } else {
        throw new Error("Invalid CFX token");
    }
}

if(!isBrowser()) {
    module.exports.resolve = resolve;
}