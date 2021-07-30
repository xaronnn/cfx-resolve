"use strict";

let STATIC = {
    CFX: "https://cfx.re/join/",
    IP_API: "http://ip-api.com/json/",
    CORS_API: "http://cors-anywhere.herokuapp.com/",
    STREAM_API: "https://servers-frontend.fivem.net/api/servers/single/"
}

const isBrowser = () => typeof window !== "undefined";

if(isBrowser()) {
    STATIC.CFX = STATIC.CORS_API+STATIC.CFX;
    STATIC.STREAM_API = STATIC.CORS_API+STATIC.STREAM_API;
}

function escapeRegExp(string) {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

async function req(url, post = false) {
    let options = {};
    if(post) {
        options = {
            mode: "cors",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "origin": url,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            body: "method=getEndpoints"
        };
    } else {
        options = {
            mode: "cors",
            headers: {
                "Access-Control-Allow-Origin": "*",
                "origin": url
            }
        };
    }
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
    if(token.includes("join/")) {
        token = token.split("join/")[1];
    }
    if(options && typeof options != "object") throw new Error("Options type should be object");
    if(typeof token == "string") {
        const request = await req(STATIC.CFX+token);
        if(!request) throw new Error("An error occurred while handle request");
        let host = request.headers.get("x-citizenfx-url");
        if(!host) throw new Error("Host not found");
        if(host.includes("users.cfx.re")) {
            console.log(host);
            
            let fetchHost = await req(host+"client", true);
            fetchHost = await fetchHost.json();
            if(fetchHost.error) throw new Error("An error occurred while resolve host");
            if(fetchHost.length <= 0) throw new Error("An error occurred while resolve host");
            host = "http://"+fetchHost[0]+"/";
        }
        data.host = host.match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g)[0];
        data.ip = host.match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g)[0].split(":")[0];
        data.port = host.match(/(\d{1,3}\.){3}\d{1,3}:\d{1,5}/g)[0].split(":")[1];
        if(!data.ip || !data.port) throw new Error("An error occurred while parse data");
        data.port = Number(data.port);
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
            let stream = await req(STATIC.STREAM_API+token);
            stream = await stream.json();
            for (let i = 0; i <= 9; i++) {
                dynamic.hostname = replaceAll(dynamic.hostname, "^"+i, "")
            }
            data.info = {
                "hostname": (dynamic.hostname ? dynamic.hostname : "Not Provided"),
                "players": (dynamic.clients ? Number(dynamic.clients) : 0),
                "slot": (dynamic.sv_maxclients ? Number(dynamic.sv_maxclients) : 0),
                "online": (dynamic.clients ? Number(dynamic.clients) : 0) + "/" + (dynamic.sv_maxclients ? Number(dynamic.sv_maxclients) : 0),
                "boost": (stream.Data ? (stream.Data.upvotePower ? Number(stream.Data.upvotePower) : 0) : 0),
                "private": (stream.Data ? (stream.Data.private ? stream.Data.private : false) : false),
                "owner": (stream.Data ? (stream.Data.ownerName ? {
                    "username": (stream.Data ? (stream.Data.ownerName ? stream.Data.ownerName : "Not Provided") : "Not Provided"),
                    "profile": (stream.Data ? (stream.Data.ownerProfile ? stream.Data.ownerProfile : "Not Provided") : "Not Provided"),
                    "avatar": (stream.Data ? (stream.Data.ownerAvatar ? stream.Data.ownerAvatar : "Not Provided") : "Not Provided"),
                    "lastSeen": (stream.Data ? (stream.Data.lastSeen ? stream.Data.lastSeen : "Not Provided") : "Not Provided"),
                } : "Not Provided") : "Not Provided"),
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
