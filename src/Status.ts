import Server  = require("./Server");
import Http    = require("http");
import Utils   = require("./Utils");
var rollbar = require("rollbar");

/**
 * Server component that respond to status requests
 */
export class StatusComponent extends Server.ServerComponent {

    private config: AppConfig;

    private repository: StatusRepository;

    constructor(config: AppConfig) {
        super();

        this.config = config;

        rollbar.init(process.env.OPENSHIFT_ROLLBAR_KEY || "abcdef1234");

        this.repository = new StatusRepository(Utils.Observable.getInstance());
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: Message<any>): any {
        if (request.url == "/status" || request.url == "/") {
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
    private observable: Utils.Observable<any>;

    public roomCount: number;
    public playerCount: number;

    constructor(observable: Utils.Observable<any>) {
        this.observable = observable;

        this.roomCount = 0;
        this.playerCount = 0;

        /**
         * Register errors handlers
         */
        process.on('uncaughtException', (err) => {
            rollbar.handleError(err);
        });
        this.observable.addListener("Error", (data) => {
            rollbar.handleError(data.err);
        });
        this.observable.addListener("RequestError", (data) => {
            rollbar.handleError(data.err, data.req);
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