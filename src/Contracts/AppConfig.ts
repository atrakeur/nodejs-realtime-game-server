interface AppConfig
{
    /**
     * Address to bind to
     */
    address: string;
    /**
     * Port number to bind to
     */
    port: number;

    /**
     * Key to debug with callback
     */
    callback_debug_key: string;

    /**
     * Secure key to use for private communication
     */
    secure_key: string;

    /**
     * Rollbar key for loggin (leave empty for console login)
     */
    rollbar_key: string;
}
