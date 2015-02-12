export class RoomList {

    private config: AppConfig;

    private rooms: Room[];

    constructor(config: AppConfig) {
        this.config = config;

        this.rooms = [];
    }

    public createRoom(hash: string): Room {
        var room = new Room(hash);
        this.rooms[hash] = room;
        return room;
    }

    public getRoom(hash: string): Room {
        return this.rooms[hash];
    }

    public deleteRoom(hash: string): void {
        delete this.rooms[hash];
    }

}

export class Room {

    private hash: string;

    constructor(hash: string) {
        this.hash = hash;
    }

}