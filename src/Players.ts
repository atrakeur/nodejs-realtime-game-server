/// <reference path="./Contracts/AppConfig.ts" />
/// <reference path="./Contracts/Message.ts" />
/// <reference path="./Contracts/PlayerConfig.ts" />

import Http = require("http");

import Server = require("./Server");
import Utils  = require("./Utils");

/**
 * Manages player list
 *
 * @event Player_connected
 * @event Player_reconnected
 * @event Player_disconnected
 */
export class PlayerList extends Server.ServerComponent {

    private config: AppConfig;

    private players: Utils.Map<string, Player>;

    constructor(config: AppConfig) {
        super();

        this.config = config;

        this.players = new Utils.Map<string, Player>();
    }

    handleHttp(request: Http.ServerRequest, responce: Http.ServerResponse, data: Message<any>): any {
        return false;
    }

    handleSocket(socket:SocketIO.Socket): void {
        socket.on("message", (message: Message<PlayerConfig>) => {
            if (message.name == "Player_conn") {
                this.connPlayer(socket, message.data);
            }
        });
    }

    handleWatchdog(counter: number) {
        this.players.foreachValue((key: string, player: Player) => {
            if (!player.isAlive()) {
                this.players.remove(key);
            }
        });
    }

    /**
     * Handle a conn message, sent every time after a socket connection is made
     * @param socket
     * @param message
     */
    connPlayer(socket: SocketIO.Socket, config: PlayerConfig) {
        if (this.players.containsKey(config.hash)) {
            //Register a new connection to a player
            var player = this.players.get(config.hash);
            player.onReconnect(socket);

            Utils.Observable.getInstance().dispatch("Player_reconnected", player);
        } else {
            //Regster a new player
            var player = new Player(config);
            this.players.add(player.getID(), player);
            player.onConnect(socket);

            Utils.Observable.getInstance().dispatch("Player_connected", player);
        }

        //Register disconnect event
        socket.on("disconnect", () => {
            player.onDisconnect();

            Utils.Observable.getInstance().dispatch("Player_disconnected", player);
        });
    }
}

export class Player {

    public static PLAYER_TIMEOUT = 10 * 1000;

    public config: PlayerConfig;

    private socket: SocketIO.Socket;
    private lastSocketDate: number;

    public constructor(config: PlayerConfig) {
        this.config = config;
    }

    public onConnect(socket: SocketIO.Socket) {
        this.socket = socket;
        this.lastSocketDate = Date.now();
    }

    public onReconnect(socket: SocketIO.Socket) {
        this.socket = socket;
        this.lastSocketDate = Date.now();
    }

    public onDisconnect() {
        this.socket = null;
        this.lastSocketDate = Date.now();
    }

    public onDelete() {

    }

    public getID(): string {
        return this.config.hash;
    }

    public isAlive(): boolean {
        return this.socket != null || this.lastSocketDate + Player.PLAYER_TIMEOUT < Date.now();
    }

}