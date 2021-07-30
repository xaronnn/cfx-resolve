# CFX-Resolve

Resolve CFX token to host informations for FiveM

# CDN

-   Call to your page if you want to use on web version (`https://cdn.jsdelivr.net/gh/xaronnn/cfx-resolve/cfx-resolve.js`)
-   Call to your application if you want to use on Node (`require("xaronnn/cfx-resolve")` with `npm i xaronnn/cfx-resolve` or `yarn add xaronnn/cfx-resolve`)

# Usage

```javascript
resolve("5odg9a", { //cfx token (cfx.re/join/5odg9a)
    "info": true, //additional returns server informations
    "players": true, //additinal returns server players list
    "geo": true //additional returns IP geo location
}).then(data => {
    console.log(data);
}).catch(err => {
    console.log("[ERROR] "+err.message);
})
```

# License

Distributed under the [Apache-2.0](https://github.com/xaronnn/cfx-resolve/blob/main/LICENSE) License. See `LICENSE` for more information.
