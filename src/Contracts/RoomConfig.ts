/**
 * JSON type interface for Room Configuraton
 * Send on
 *      - Room_create
 *      - Room_delete (hash only)
 */
interface RoomConfig {

    //Room hash used in all reaquest to designate room
    roomhash: string;

    //Room data used when creating room
    roomname: string;
    callbackUrl : string;

    //Message used when sending a message to a room
    message: any;

}