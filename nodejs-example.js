const { resolve } = require("cfx-resolve");

resolve("5odg9a", { //cfx token ("5odg9a" or https://cfx.re/join/5odg9a)
    "info": true, //additional returns server informations
    "players": true, //additinal returns server players list
    "geo": true //additional returns IP geo location
}).then(data => {
    console.log(data);
}).catch(err => {
    console.log("[ERROR] "+err.message);
})
