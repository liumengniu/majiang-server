const Applets = {
    dev: "dev",
    test: "test",
    prod: "prod",
};

const env = "dev"; //"prod"

const config = {
    version: "1.0.0",
    [Applets.dev]: {
        host: "http://192.168.1.9",
        port: 4000,
        ws: "ws://192.168.1.9:8082",
        wssPort: 8082
    },
    [Applets.test]: {
        host: "https://xxx.com",
        port: 443,
        wss: "wss://xxx.com:8082",
        wssPort: 8082
    },
    [Applets.prod]: {
        host: "https://xxx.com",
        port: 443,
        wss: "wss://xxx.com:8082",
        wssPort: 8082
    }
};

module.exports = config[env];
