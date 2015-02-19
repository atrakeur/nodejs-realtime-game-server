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

        Utils.Observable.getInstance().addListener("Server_stop", (reason: any) => {
            this.players.foreachValue((key: string, player: Player) => {
                player.emit("shutdown", reason);
            });
        });
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

    /**
     * Handle watch dog (clear out old players, and send ping requests)
     * @param counter
     */
    handleWatchdog(counter: number) {
        this.players.foreachValue((key: string, player: Player) => {
            if (!player.isAlive()) {
                this.players.remove(key);
            }
            if(player.shouldPing()) {
                player.emit("ping");
                player.onPing();
            }
        });
    }

    /**
     * Handle a conn message, sent every time after a socket connection is made
     * @param socket
     * @param message
     */
    connPlayer(socket: SocketIO.Socket, config: PlayerConfig) {
        if (this.players.containsKey(config.userhash)) {
            //Register a new connection to a player
            var player = this.players.get(config.userhash);
            player.onReconnect(socket);

            Utils.Observable.getInstance().dispatch("Player_reconnected", player);
        } else {
            //Regster a new player
            var player = new Player(config);
            this.players.add(player.getID(), player);
            player.onConnect(socket);

            Utils.Observable.getInstance().dispatch("Player_connected", player);
        }

        //Register ping/pong event
        socket.on("pong", () => {
            player.onPong();
            Utils.Observable.getInstance().dispatch("Player_pong", player);
        });

        //Register disconnect event
        socket.on("disconnect", () => {
            console.log("Player "+player.getID()+" disconnected!");
            player.onDisconnect();
            Utils.Observable.getInstance().dispatch("Player_disconnected", player);
        });
    }
}

export class Player {

    public static PLAYER_TIMEOUT = 10 * 1000;
    public static PLAYER_PINGTIME = 5 * 1000;

    public config: PlayerConfig;

    //Socket instance (or null if no connection ATM)
    private socket: SocketIO.Socket;
    //Date of last ping sent
    private lastSocketPing: number;
    //Date of last connection received
    private lastSocketDate: number;
    //Average latency calculated
    private latency: number;

    public constructor(config: PlayerConfig) {
        this.config = config;

        this.latency = -1;
    }

    public onConnect(socket: SocketIO.Socket) {
        this.socket = socket;
        this.lastSocketDate = Date.now();
        this.lastSocketPing = Date.now();
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
        return this.config.userhash;
    }

    public isAlive(): boolean {
        return this.socket != null || this.lastSocketDate + Player.PLAYER_TIMEOUT < Date.now();
    }

    public shouldPing(): boolean {
        return this.socket != null && this.lastSocketPing + Player.PLAYER_PINGTIME < Date.now();
    }

    public onPing() {
        this.lastSocketPing = Date.now();
    }

    public onPong() {
        if (this.latency == -1)
        {
            this.latency = Date.now() - this.lastSocketPing;
        }
        else
        {
            var newLatency = Date.now() - this.lastSocketPing;
            this.latency = (this.latency + newLatency) / 2;
        }
    }

    public emit(name: string, ...args: any[]) {
        this.socket.emit(name, args);
    }



}