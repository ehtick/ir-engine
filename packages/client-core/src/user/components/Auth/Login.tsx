import React, { Fragment, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { getMutableState, useHookstate } from '@etherealengine/hyperflux'
import Icon from '@etherealengine/ui/src/primitives/mui/Icon'
import Tab from '@etherealengine/ui/src/primitives/mui/Tab'
import Tabs from '@etherealengine/ui/src/primitives/mui/Tabs'

import { AuthSettingsState } from '../../../admin/services/Setting/AuthSettingService'
import { initialAuthState } from '../../../common/initialAuthState'
import MagicLinkEmail from './MagicLinkEmail'
import PasswordLogin from './PasswordLogin'
import SocialLogin from './SocialLogin'

interface Props {
  children: JSX.Element
  value: number
  index: number
}

const TabPanel = ({ children, value, index }: Props): JSX.Element => {
  return <Fragment>{value === index && children}</Fragment>
}

/**
 * Used for Editor's SignInPage.tsx only.
 * @constructor
 */
const SignIn = (): JSX.Element => {
  const authSettingState = useHookstate(getMutableState(AuthSettingsState))
  const [authSetting] = authSettingState?.authSettings?.value || []
  const state = useHookstate(initialAuthState)

  useEffect(() => {
    if (authSetting) {
      let temp = { ...initialAuthState }
      authSetting?.authStrategies?.forEach((el) => {
        Object.entries(el).forEach(([strategyName, strategy]) => {
          temp[strategyName] = strategy
        })
      })
      state.set(temp)
    }
  }, [authSettingState?.updateNeeded?.value])

  let enableSmsMagicLink = true
  let enableEmailMagicLink = true
  let enableUserPassword = false
  let enableDiscordSocial = false
  let enableGithubSocial = false
  let enableGoogleSocial = false
  let enableFacebookSocial = false
  let enableLinkedInSocial = false
  let enableTwitterSocial = false
  let enableDidWallet = false

  const tabIndex = useHookstate(0)
  const { t } = useTranslation()

  const handleChange = (event: any, newValue: number): void => {
    event.preventDefault()
    tabIndex.set(newValue)
  }

  enableSmsMagicLink = state.smsMagicLink.value
  enableEmailMagicLink = state.emailMagicLink.value
  enableUserPassword = state.local.value
  enableDiscordSocial = state.discord.value
  enableGithubSocial = state.github.value
  enableGoogleSocial = state.google.value
  enableFacebookSocial = state.facebook.value
  enableLinkedInSocial = state.linkedin.value
  enableTwitterSocial = state.twitter.value
  enableDidWallet = state.didWallet.value

  const socials = [
    enableDiscordSocial,
    enableGithubSocial,
    enableGoogleSocial,
    enableFacebookSocial,
    enableLinkedInSocial,
    enableTwitterSocial
  ]
  const enabled = [
    enableSmsMagicLink,
    enableEmailMagicLink,
    enableUserPassword,
    enableDiscordSocial,
    enableGithubSocial,
    enableGoogleSocial,
    enableFacebookSocial,
    enableLinkedInSocial,
    enableTwitterSocial,
    enableDidWallet
  ]

  const enabledCount = enabled.filter((v) => v).length
  const socialCount = socials.filter((v) => v).length

  let component = <MagicLinkEmail />
  if (enabledCount === 1) {
    if (enableSmsMagicLink) {
      component = <MagicLinkEmail />
    } else if (enableEmailMagicLink) {
      component = <MagicLinkEmail />
    } else if (enableUserPassword) {
      component = <PasswordLogin />
    } else if (socialCount > 0) {
      component = <SocialLogin />
    }
  } else {
    let index = 0
    const emailTab = (enableEmailMagicLink || enableSmsMagicLink) && (
      <Tab icon={<Icon type="Email" />} label={t('user:auth.login.email')} />
    )
    const emailTabPanel = (enableEmailMagicLink || enableSmsMagicLink) && (
      <TabPanel value={tabIndex.value} index={index}>
        <MagicLinkEmail />
      </TabPanel>
    )
    ;(enableEmailMagicLink || enableSmsMagicLink) && ++index

    const userTab = enableUserPassword && <Tab icon={<Icon type="User" />} label={t('user:auth.login.username')} />
    const userTabPanel = enableUserPassword && (
      <TabPanel value={tabIndex.value} index={index}>
        <PasswordLogin />
      </TabPanel>
    )
    enableUserPassword && ++index

    const socialTab = socialCount > 0 && <Tab icon={<Icon type="Social" />} label={t('user:auth.login.social')} />
    const socialTabPanel = socialCount > 0 && (
      <TabPanel value={tabIndex.value} index={index}>
        <SocialLogin
          enableDiscordSocial={enableDiscordSocial}
          enableFacebookSocial={enableFacebookSocial}
          enableGoogleSocial={enableGoogleSocial}
          enableGithubSocial={enableGithubSocial}
          enableLinkedInSocial={enableLinkedInSocial}
          enableTwitterSocial={enableTwitterSocial}
        />
      </TabPanel>
    )
    socialCount > 0 && ++index

    component = (
      <Fragment>
        {(enableUserPassword || socialCount > 0) && (
          <Tabs
            value={tabIndex.value}
            onChange={handleChange}
            variant="fullWidth"
            indicatorColor="secondary"
            textColor="secondary"
            aria-label="Login Configure"
          >
            {emailTab}
            {userTab}
            {socialTab}
          </Tabs>
        )}
        {emailTabPanel}
        {userTabPanel}
        {socialTabPanel}
      </Fragment>
    )
  }

  return component
}

export default SignIn
