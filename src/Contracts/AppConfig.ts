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
     * Url to use for configuration
     */
    config_url: string;
}
