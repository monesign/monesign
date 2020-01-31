import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { BackButton, Bar, textStyle } from '@aragon/ui'
import { AppType } from '../../prop-types'
import { usePermissionsByRole } from '../../contexts/PermissionsContext'
import EmptyBlock from './EmptyBlock'
import PermissionsView from './PermissionsView'

function AppPermissions({
  app,
  loading,
  onAssignPermission,
  onBack,
  onManageRole,
}) {
  const permissions = usePermissionsByRole()

  const appProxyAddress = app ? app.proxyAddress : null

  const appPermissions = useMemo(
    () =>
      appProxyAddress
        ? permissions.filter(
            permission =>
              permission.app && permission.app.proxyAddress === appProxyAddress
          )
        : [],
    [permissions, appProxyAddress]
  )

  if (loading || !appProxyAddress) {
    return <EmptyBlock>Loading permissions…</EmptyBlock>
  }

  if (appPermissions.length === 0) {
    return <EmptyBlock>No permissions found.</EmptyBlock>
  }

  return (
    <React.Fragment>
      <Bar>
        <BackButton onClick={onBack} />
      </Bar>
      <PermissionsView
        heading={
          <span
            css={`
              ${textStyle('body1')}
            `}
          >
            Available permissions
          </span>
        }
        onAssignPermission={onAssignPermission}
        onManageRole={onManageRole}
        permissions={appPermissions}
        showApps={false}
      />
    </React.Fragment>
  )
}

AppPermissions.propTypes = {
  app: AppType, // may not be available if still loading
  loading: PropTypes.bool.isRequired,
  onAssignPermission: PropTypes.func.isRequired,
  onManageRole: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default AppPermissions
