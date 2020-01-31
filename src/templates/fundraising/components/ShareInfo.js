import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { GU, Info, useTheme } from '@aragon/ui'
import { Header, Navigation, ScreenPropsType } from '../../kit'

function ShareInfo({
  screenProps: { back, data, next, screenIndex, screens },
}) {
  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      next({ ...data })
    },
    [data, next]
  )

  return (
    <div>
      <Header
        title="Organization's shareholders"
        subtitle="Read the following information attentively"
      />
      <div
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <Paragraph>
          The shareholders are the ones contributing to the fundraising
          campaign. They are represented through a custom bonded-token and a
          voting app. They hold most of the governance rights over the
          organization.
        </Paragraph>

        <Paragraph>Shareholders can:</Paragraph>
        <Paragraph>
          <Strong>Buy and redeem tokens.</Strong> Shareholders can buy and
          redeem tokens through the Aragon Fundraising interface.
        </Paragraph>
        <Paragraph>
          <Strong>Handle fundraising parameters.</Strong> Shareholders decide on
          how beneficiary, fees, and collateralization settings should be
          updated. They also control the amount of funds automatically
          transferred to the board each month.
        </Paragraph>
        <Paragraph>
          <Strong>Handle organization settings.</Strong> Shareholders decide on
          which apps are installed or upgraded and which permissions are set.
        </Paragraph>
      </div>
      <Info
        css={`
          margin-bottom: ${3 * GU}px;
        `}
      >
        <p>
          This architecture grants most of the governance rights to
          shareholders, to protect their investment. However, this also requires
          the organization to be able to mitigate situations where a shareholder
          could own the whole organization by owning more than 50% of the
          shares.
        </p>
        <p
          css={`
            margin-top: ${1 * GU}px;
          `}
        >
          This is why shareholder votes, where most of the organization’s
          decisions are made, can only be opened and initiated by the board.
        </p>
      </Info>
      <Navigation
        backEnabled
        nextEnabled
        nextLabel={`Next: ${screens[screenIndex + 1][0]}`}
        onBack={back}
        onNext={handleSubmit}
      />
    </div>
  )
}

ShareInfo.propTypes = {
  screenProps: ScreenPropsType.isRequired,
}

function Paragraph({ children, ...props }) {
  const theme = useTheme()
  return (
    <p
      css={`
        color: ${theme.contentSecondary};
        & + & {
          margin-top: ${2 * GU}px;
        }
      `}
      {...props}
    >
      {children}
    </p>
  )
}
Paragraph.propTypes = {
  children: PropTypes.node,
}

const Strong = styled.strong`
  font-weight: 800;
`

export default ShareInfo
