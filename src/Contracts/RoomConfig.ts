/**
 * JSON type interface for Room Configuraton
 * Send on
 *      - Room_create
 *      - Room_delete (hash only)
 */
interface RoomConfig {

    hash: string;
    callbackUrl : string;

}