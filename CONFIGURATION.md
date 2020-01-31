# Build-time environment options

The app can be configured in a number of ways via environment variables. Without any settings, the app is configured to connect to our Rinkeby deployment fetching assets from IPFS.

### `ARAGON_DEFAULT_ETH_NODE`

Url of the default Ethereum node to read blockchain data from (must be WebSocket protocol). If you intend to connect to a local ganache instance, by default you should set this to `ws://localhost:8545`.

### `ARAGON_ENS_REGISTRY_ADDRESS`

Address of the ENS registry that [aragonPM](https://hack.aragon.org/docs/apm-intro) repos were registered on. If you’ve deployed [aragonOS](https://github.com/aragon/aragonOS) to a local network, you can find the ENS registry’s address in the migration’s console output.

### `ARAGON_ETH_NETWORK_TYPE`

Expected network type to connect to. Either one of `main`, `rinkeby` or `local`.

### `ARAGON_ETH_SUBSCRIPTION_EVENT_DELAY`

Time (in ms) delay between receiving an event from `eth_subscribe` to sending it for processing. Useful in cases where a node sends events faster than it can commit state changes from the event. Defaults to 0 (no delay).

### `ARAGON_IPFS_GATEWAY`

Url of the [IPFS](https://ipfs.io) gateway to load APM repos from. If you intend to connect to a local IPFS daemon, by default you should set this to `http://localhost:8080/ipfs`

### `ARAGON_APP_LOCATOR`

Which source to load app frontend assets from. Can be one of `ipfs` (uses the configured IPFS gateway) or `local` (local development servers, running on `localhost:300x`). If you intend to serve assets from a local IPFS daemon, you should set this to `ipfs`.
