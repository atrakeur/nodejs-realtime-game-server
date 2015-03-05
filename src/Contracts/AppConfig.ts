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
     * Secure key to use for private communication
     */
    secure_key: string;

    /**
     * Rollbar key for loggin (leave empty for console login)
     */
    rollbar_key: string;
}
