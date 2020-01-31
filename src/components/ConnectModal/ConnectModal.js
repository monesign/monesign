import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  GU,
  IconConnect,
  Link,
  Modal,
  textStyle,
  useTheme,
  useViewport,
} from '@aragon/ui'
import { enableWallet } from '../../wallet'
import providersImage from './assets/providers.png'

function ConnectModal({ account, onClose, onConnect, visible }) {
  const theme = useTheme()
  const { below } = useViewport()
  const smallMode = below('medium')

  const modalWidth = useCallback(
    ({ width }) => Math.min(55 * GU, width - 4 * GU),
    []
  )

  useEffect(() => {
    if (account) {
      onConnect()
    }
  }, [account, onConnect])

  return (
    <Modal visible={visible} width={modalWidth} onClose={onClose}>
      <section
        css={`
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: ${smallMode ? 0 : 3 * GU}px;
          padding-top: ${smallMode ? 5 * GU : 3 * GU}px;
          padding-bottom: ${smallMode ? 0 : 2 * GU}px;
        `}
      >
        <header
          css={`
            text-align: center;
          `}
        >
          <h1
            css={`
              max-width: ${35 * GU}px;
              margin: 0 auto ${1 * GU}px;
              ${textStyle('title1')};
              font-weight: 600;
            `}
          >
            {/*Enable your Ethereum provider*/}
            Enable your Monesign provider
          </h1>
          <p
            css={`
              max-width: ${35 * GU}px;
              ${textStyle('body1')};
              color: ${theme.contentSecondary};
            `}
          >
            {/*You need to enable your Ethereum provider to create an organization*/}
            You need to enable your Monesign provider to create an organization
          </p>
          <p
            css={`
              padding: ${3 * GU}px 0;
              text-align: center;
              color: ${theme.contentSecondary};
            `}
          >
            <Link href="https://www.ethereum.org/use/#_3-what-is-a-wallet-and-which-one-should-i-use">
              {/*What is a Ethereum provider?*/}
              What is a Monesign provider?
            </Link>
          </p>
        </header>
        <div>
          <img
            width="296"
            height="80"
            src={providersImage}
            alt=""
            css={`
              display: block;
              margin: 0 auto ${4 * GU}px;
              width: ${smallMode ? 222 : 296}px;
              height: auto;
            `}
          />
        </div>
        <Button
          icon={<IconConnect />}
          label="Enable account"
          mode="strong"
          onClick={enableWallet}
          wide
        />
      </section>
    </Modal>
  )
}

ConnectModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onConnect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  account: PropTypes.string,
}

export default ConnectModal
