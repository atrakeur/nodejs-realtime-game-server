import Server  = require("./Server");
import Http    = require("http");
import Utils   = require("./Utils");
var memwatch    = require('memwatch');
var rollbar     = require("rollbar");
var colors: any = require('colors/safe');

/**
 * Server component that respond to status requests
 */
export class StatusComponent extends Server.ServerComponent {

    private config: AppConfig;

    private repository: StatusRepository;

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.repository = new StatusRepository(config, Utils.Observable.getInstance());
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, message: Message<any>): any {
        if (request.url == "/status" || request.url == "/" || message.name == "status") {
            var jsonData = {
                status: "OK",
                roomCount: this.repository.roomCount,
                playerCount: this.repository.playerCount
            };
            responce.write(JSON.stringify(jsonData));
            return responce;
        }
    }

    handleSocket(socket:SocketIO.Socket): void {
    }

    /**
     * Handle watch dog (clear out old players, and send ping requests)
     * @param counter
     */
    handleWatchdog(counter: number) {
    }

}

/**
 * Register and hold status values
 */
export class StatusRepository {
    private config: AppConfig;
    private observable: Utils.Observable<any>;

    public roomCount: number;
    public playerCount: number;

    constructor(config: AppConfig, observable: Utils.Observable<any>) {
        this.config = config;
        this.observable = observable;

        this.roomCount = 0;
        this.playerCount = 0;

        if (config.rollbar_key != "") {
            rollbar.init(config.rollbar_key);
        }

        /**
         * Register errors handlers
         */
        memwatch.on('leak', (info: any) => {
            if (config.rollbar_key != "") {
                rollbar.handleErrorWithPayloadData("Memory Leak", {custom: info});
            } else {
                console.error(colors.red("[Leak] "+JSON.stringify(info)));
            }
        });
        memwatch.on('stats', (info: any) => {
            if (config.rollbar_key == "") {
                console.log(colors.yellow("[Memstats] "+JSON.stringify(info)));
            }
        });
        process.on('uncaughtException', (err) => {
            if (config.rollbar_key != "") {
                rollbar.handleError(err);
            } else {
                console.error(colors.red("[UncaughtError] "+err+ " " + JSON.stringify(err.stack)));
            }
        });
        this.observable.addListener("Info", (data) => {
            if (config.rollbar_key != "") {
                rollbar.reportMessage(data.err, "info");
            } else {
                console.error(colors.green("[Info] "+JSON.stringify(data.err)));
            }
        });
        this.observable.addListener("Debug", (data) => {
            if (config.rollbar_key != "") {
                //Don't log to rollbar
            } else {
                console.error(colors.green("[Debug] "+JSON.stringify(data.err)));
            }
        });
        this.observable.addListener("Warning", (data) => {
            if (config.rollbar_key != "") {
                rollbar.reportMessage(data.err, "warning");
            } else {
                console.error(colors.yellow("[Warning] "+JSON.stringify(data.err)));
            }
        });
        this.observable.addListener("Error", (data) => {
            if (config.rollbar_key != "") {
                rollbar.handleError(data.err);
            } else {
                console.error(colors.red("[Error] "+data.err+ " "+JSON.stringify(data.err)));
            }
        });
        this.observable.addListener("RequestError", (data) => {
            if (config.rollbar_key != "") {
                rollbar.handleErrorWithPayloadData(data.err, {custom: {data: data.data}}, data.req);
            } else {
                console.error(colors.red("[RequestError] "+data.err+" "+data.req));
                if (data.err.stack != undefined) {
                    console.error(colors.red(data.err.stack));
                }
                console.error(colors.red(JSON.stringify(data.data)));
            }
        });
        this.observable.addListener("SocketError", (data: any) => {
            if (data.err == undefined) {
                var data = <any>{err: data};
            }

            if (config.rollbar_key != "") {
                rollbar.handleError(data.err, data.req);
            } else {
                data.req.emit('servererror', data.err);
                console.error(colors.red("[SocketError] "+JSON.stringify(data.err)));
            }
        });
        this.observable.addListener("Server_stopped", () => {
            rollbar.shutdown();
        });


        /**
         * Register status handlers
         */
        this.observable.addListener("Room_created", () => {
            this.roomCount++;
        });
        this.observable.addListener("Room_deleted", () => {
            this.roomCount--;
        });
        this.observable.addListener("Player_connected", () => {
            this.playerCount++;
        });
        this.observable.addListener("Player_disconnected", () => {
            this.playerCount--;
        });


    }
}