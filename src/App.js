import React from 'react'
import PropTypes from 'prop-types'
import { createHashHistory as createHistory } from 'history'
import { Spring, animated } from 'react-spring'
import { useTheme } from '@aragon/ui'
import { EthereumAddressType } from './prop-types'
import { network, web3Providers } from './environment'
import {
  ARAGONID_ENS_DOMAIN,
  getAppPath,
  getPreferencesSearch,
  parsePath,
} from './routing'
import initWrapper, { pollConnectivity } from './aragonjs-wrapper'
import Wrapper from './Wrapper'
import { Onboarding } from './onboarding'
import { getWeb3 } from './web3-utils'
import { useWallet } from './wallet'
import { log } from './utils'
import { ActivityProvider } from './contexts/ActivityContext'
import { FavoriteDaosProvider } from './contexts/FavoriteDaosContext'
import { PermissionsProvider } from './contexts/PermissionsContext'
import { IdentityProvider } from './components/IdentityManager/IdentityManager'
import { LocalIdentityModalProvider } from './components/LocalIdentityModal/LocalIdentityModalManager'
import LocalIdentityModal from './components/LocalIdentityModal/LocalIdentityModal'
import HelpScoutBeacon from './components/HelpScoutBeacon/HelpScoutBeacon'
import GlobalPreferences from './components/GlobalPreferences/GlobalPreferences'
import CustomToast from './components/CustomToast/CustomToast'

import { isKnownRepo } from './repo-utils'
import {
  APP_MODE_START,
  APP_MODE_ORG,
  APP_MODE_SETUP,
  APPS_STATUS_ERROR,
  APPS_STATUS_READY,
  APPS_STATUS_LOADING,
  APPS_STATUS_UNLOADED,
  DAO_STATUS_ERROR,
  DAO_STATUS_READY,
  DAO_STATUS_LOADING,
  DAO_STATUS_UNLOADED,
} from './symbols'

const INITIAL_DAO_STATE = {
  apps: [],
  appIdentifiers: {},
  appsStatus: APPS_STATUS_UNLOADED,
  daoAddress: { address: '', domain: '' },
  daoStatus: DAO_STATUS_UNLOADED,
  permissions: {},
  permissionsLoading: true,
  repos: [],
}

// const SELECTOR_NETWORKS = [
//   ['main', 'Ethereum Mainnet', 'https://mainnet.aragon.org/'],
//   ['rinkeby', 'Ethereum Testnet (Rinkeby)', 'https://rinkeby.aragon.org/'],
// ]
const SELECTOR_NETWORKS = [
  ['main', 'Monesign Mainnet', 'http://xenturion.io/'],
  ['rinkeby', 'Monesign Testnet (Osokorky)', 'http://xenturion.io/'],
]
if (network.type === 'ropsten') {
  SELECTOR_NETWORKS.push([
    'ropsten',
    'Ethereum Testnet (Ropsten)',
    'https://aragon.ropsten.aragonpm.com/',
  ])
}

class App extends React.Component {
  static propTypes = {
    theme: PropTypes.object.isRequired,
    walletAccount: EthereumAddressType,
  }

  state = {
    ...INITIAL_DAO_STATE,
    connected: false,
    fatalError: null,
    identityIntent: null,
    locator: {},
    prevLocator: null,
    selectorNetworks: SELECTOR_NETWORKS,
    transactionBag: null,
    signatureBag: null,
    web3: getWeb3(web3Providers.default),
    wrapper: null,
  }

  history = createHistory()

  componentDidMount() {
    const { pathname, search } = this.history.location
    this.handleHistoryChange({ pathname, search })
    this.history.listen(this.handleHistoryChange)

    // Only the default, because the app can work without the wallet
    pollConnectivity([web3Providers.default], connected => {
      this.setState({ connected })
    })
  }

  componentDidUpdate(prevProps) {
    const { walletAccount } = this.props
    if (walletAccount !== prevProps.walletAccount && this.state.wrapper) {
      this.state.wrapper.setAccounts(
        walletAccount === null ? [] : [walletAccount]
      )
    }
  }

  // Handle URL changes
  handleHistoryChange = ({ pathname, search, state = {} }) => {
    if (!state.alreadyParsed) {
      this.updateLocator(parsePath(pathname, search))
    }
  }

  // Change the URL if needed
  historyPush = path => {
    if (path !== this.state.locator.path) {
      this.history.push(path)
    }
  }

  // Change the URL to the previous one
  historyBack = () => {
    if (this.state.prevLocator) {
      this.history.goBack()
    } else {
      this.history.replace('/')
    }
  }

  updateLocator = locator => {
    const { locator: prevLocator } = this.state

    // New DAO: need to reinit the wrapper
    if (locator.dao && (!prevLocator || locator.dao !== prevLocator.dao)) {
      this.updateDao(locator.dao)
    }

    // Moving from a DAO to somewhere else (like onboarding):
    // need to cancel the subscribtions.
    if (!locator.dao && prevLocator && prevLocator.dao) {
      this.updateDao(null)
    }

    // Replace URL with non-aragonid.eth version
    if (locator.dao && locator.dao.endsWith(ARAGONID_ENS_DOMAIN)) {
      this.history.replace({
        pathname: locator.pathname.replace(`.${ARAGONID_ENS_DOMAIN}`, ''),
        search: locator.search,
        state: { alreadyParsed: true },
      })
    }

    this.setState({ locator, prevLocator })
  }

  updateDao(dao = null) {
    const { walletAccount } = this.props
    // Cancel the subscriptions / unload the wrapper
    if (this.state.wrapper) {
      this.state.wrapper.cancel()
      this.setState({ wrapper: null })
    }

    // Reset the DAO state
    this.setState({
      ...INITIAL_DAO_STATE,
    })

    if (dao === null) {
      return
    }

    // Loading state
    this.setState({
      appsStatus: APPS_STATUS_LOADING,
      daoStatus: DAO_STATUS_LOADING,
    })

    log('Init DAO', dao)
    initWrapper(dao, {
      provider: web3Providers.default,
      walletAccount,
      walletProvider: web3Providers.wallet,
      onDaoAddress: ({ address, domain }) => {
        log('dao address', address)
        log('dao domain', domain)
        this.setState({
          daoStatus: DAO_STATUS_READY,
          daoAddress: { address, domain },
        })
      },
      onWeb3: web3 => {
        log('web3', web3)
      },
      onApps: apps => {
        log('apps updated', apps)
        this.setState({
          apps,
          appsStatus: APPS_STATUS_READY,
        })
      },
      onPermissions: permissions => {
        log('permissions updated', permissions)
        this.setState({
          permissions,
          permissionsLoading: false,
        })
      },
      onForwarders: forwarders => {
        log('forwarders', forwarders)
      },
      onAppIdentifiers: appIdentifiers => {
        log('app identifiers', appIdentifiers)
        this.setState({ appIdentifiers })
      },
      onInstalledRepos: repos => {
        log('installed repos', repos)
        const canUpgradeOrg = repos.some(
          ({ appId, currentVersion, latestVersion }) =>
            isKnownRepo(appId) &&
            currentVersion.version.split('.')[0] <
              latestVersion.version.split('.')[0]
        )
        this.setState({ canUpgradeOrg, repos })
      },
      onTransaction: transactionBag => {
        log('transaction bag', transactionBag)
        this.setState({ transactionBag })
      },
      onSignatures: signatureBag => {
        log('signature bag', signatureBag)
        this.setState({ signatureBag })
      },
      onIdentityIntent: async identityIntent => {
        // set the state for modifying a specific address identity
        let name = null
        try {
          const identity = await this.handleIdentityResolve(
            identityIntent.address
          )
          name = identity.name
        } catch (_) {}
        this.setState({
          identityIntent: {
            label: name,
            ...identityIntent,
          },
        })
      },
      onRequestPath: ({ appAddress, path, resolve, reject }) => {
        const { locator } = this.state
        if (appAddress !== locator.instanceId) {
          reject(
            `Can’t change the path of ${appAddress}: the app is not currently active.`
          )
          return
        }

        resolve()

        window.location.hash = getAppPath({
          dao,
          instanceId: locator.instanceId,
          instancePath: path,
          mode: APP_MODE_ORG,
        })
      },
    })
      .then(wrapper => {
        const { walletAccount } = this.props
        if (walletAccount !== null) {
          wrapper.setAccounts([walletAccount])
        }
        this.setState({ wrapper })
        return wrapper
      })
      .catch(err => {
        log(`Wrapper init, fatal error: ${err.name}. ${err.message}.`)
        this.setState({
          appsStatus: APPS_STATUS_ERROR,
          daoStatus: DAO_STATUS_ERROR,
          fatalError: err,
        })
      })
  }

  handleIdentityCancel = () => {
    const { identityIntent } = this.state
    identityIntent.reject(new Error('Identity modification cancelled'))
    this.setState({ identityIntent: null })
  }

  handleIdentitySave = ({ address, label }) => {
    const { identityIntent } = this.state
    this.state.wrapper
      .modifyAddressIdentity(address, { name: label })
      .then(identityIntent.resolve)
      .then(() => this.setState({ identityIntent: null }))
      .catch(identityIntent.reject)
  }

  handleIdentityResolve = address => {
    // returns promise
    if (this.state.wrapper) {
      return this.state.wrapper.resolveAddressIdentity(address)
    } else {
      // wrapper has not been initialized
      // re-request in 100 ms
      return new Promise(resolve => {
        setTimeout(async () => {
          resolve(await this.handleIdentityResolve(address))
        }, 100)
      })
    }
  }

  handleOpenLocalIdentityModal = address => {
    return this.state.wrapper.requestAddressIdentityModification(address)
  }

  closePreferences = () => {
    const { locator } = this.state
    this.historyPush(getAppPath({ ...locator, search: '' }))
  }

  openPreferences = (screen, data) => {
    const { locator } = this.state
    this.historyPush(
      getAppPath({ ...locator, search: getPreferencesSearch(screen, data) })
    )
  }

  render() {
    const { theme } = this.props
    const {
      apps,
      appIdentifiers,
      appsStatus,
      canUpgradeOrg,
      connected,
      daoAddress,
      daoStatus,
      fatalError,
      identityIntent,
      locator,
      permissions,
      permissionsLoading,
      repos,
      selectorNetworks,
      transactionBag,
      signatureBag,
      web3,
      wrapper,
    } = this.state

    const { mode } = locator
    const { address: intentAddress = null, label: intentLabel = '' } =
      identityIntent || {}

    if (!mode) {
      return null
    }
    if (fatalError !== null) {
      throw fatalError
    }

    const appsWithIdentifiers = apps.map(app => {
      const identifier = appIdentifiers[app.proxyAddress]
      return identifier
        ? {
            identifier,
            ...app,
          }
        : app
    })

    return (
      <Spring
        from={{ opacity: 0, scale: 0.98 }}
        to={{ opacity: 1, scale: 1 }}
        native
      >
        {({ opacity, scale }) => (
          <animated.div
            style={{
              opacity,
              background: theme.background,
            }}
          >
            <animated.div
              style={{
                transform: scale.interpolate(v => `scale3d(${v}, ${v}, 1)`),
              }}
            >
              <CustomToast>
                <IdentityProvider onResolve={this.handleIdentityResolve}>
                  <LocalIdentityModalProvider
                    onShowLocalIdentityModal={this.handleOpenLocalIdentityModal}
                  >
                    <LocalIdentityModal
                      address={intentAddress}
                      label={intentLabel}
                      opened={identityIntent !== null}
                      onCancel={this.handleIdentityCancel}
                      onSave={this.handleIdentitySave}
                    />
                    <FavoriteDaosProvider>
                      <ActivityProvider
                        daoDomain={daoAddress.domain}
                        web3={web3}
                      >
                        <PermissionsProvider
                          wrapper={wrapper}
                          apps={appsWithIdentifiers}
                          permissions={permissions}
                        >
                          <div css="position: relative; z-index: 0">
                            <Wrapper
                              visible={mode === APP_MODE_ORG}
                              apps={appsWithIdentifiers}
                              appsStatus={appsStatus}
                              canUpgradeOrg={canUpgradeOrg}
                              connected={connected}
                              daoAddress={daoAddress}
                              daoStatus={daoStatus}
                              historyBack={this.historyBack}
                              historyPush={this.historyPush}
                              locator={locator}
                              onRequestAppsReload={this.handleRequestAppsReload}
                              openPreferences={this.openPreferences}
                              permissionsLoading={permissionsLoading}
                              repos={repos}
                              signatureBag={signatureBag}
                              transactionBag={transactionBag}
                              web3={web3}
                              wrapper={wrapper}
                            />
                          </div>
                        </PermissionsProvider>

                        <Onboarding
                          selectorNetworks={selectorNetworks}
                          status={
                            mode === APP_MODE_START || mode === APP_MODE_SETUP
                              ? locator.action || 'welcome'
                              : 'none'
                          }
                          web3={web3}
                        />

                        <GlobalPreferences
                          locator={locator}
                          wrapper={wrapper}
                          apps={appsWithIdentifiers}
                          onScreenChange={this.openPreferences}
                          onClose={this.closePreferences}
                        />

                        <HelpScoutBeacon locator={locator} apps={apps} />
                      </ActivityProvider>
                    </FavoriteDaosProvider>
                  </LocalIdentityModalProvider>
                </IdentityProvider>
              </CustomToast>
            </animated.div>
          </animated.div>
        )}
      </Spring>
    )
  }
}

export default function(props) {
  const theme = useTheme()
  const { account } = useWallet()
  return <App theme={theme} walletAccount={account} {...props} />
}
