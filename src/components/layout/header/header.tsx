import { useCallback } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { generateOAuthURL, getAppId, getCurrentProductionDomain, getDefaultAppIdAndUrl, isStaging, isTestLink, standalone_routes } from '@/components/shared';
import Button from '@/components/shared_ui/button';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, useTranslations } from '@deriv-com/translations';
import { Header, useDevice, Wrapper } from '@deriv-com/ui';
import { AppLogo } from '../app-logo';
import AccountsInfoLoader from './account-info-loader';
import AccountSwitcher from './account-switcher';
import MenuItems from './menu-items';
import MobileMenu from './mobile-menu';
import './header.scss';

type TAppHeaderProps = {
    isAuthenticating?: boolean;
};

const AppHeader = observer(({ isAuthenticating }: TAppHeaderProps) => {
    const { isDesktop } = useDevice();
    const { isAuthorizing, isAuthorized, activeLoginid } = useApiBase();
    const { client } = useStore() ?? {};

    const { data: activeAccount } = useActiveAccount({
        allBalanceData: client?.all_accounts_balance,
        directBalance: client?.balance,
    });
    const { getCurrency, is_virtual } = client ?? {};

    const currency = getCurrency?.();
    const { localize } = useTranslations();

    const { isSingleLoggingIn, oAuthLogout } = useOauth2({ handleLogout: async () => client?.logout(), client });

    // Check if there's a session token in localStorage - if so, we should show loading until auth is complete
    const hasSessionToken = typeof window !== 'undefined' && !!localStorage.getItem('session_token');

    const renderAccountSection = useCallback(() => {
        if (
            isAuthenticating ||
            isAuthorizing ||
            isSingleLoggingIn ||
            (activeLoginid && !isAuthorized) ||
            (hasSessionToken && !isAuthorized && !activeLoginid)
        ) {
            return <AccountsInfoLoader isLoggedIn isMobile={!isDesktop} speed={3} />;
        } else if (activeLoginid && isAuthorized) {
            return (
                <div className='auth-actions'>
                    <AccountSwitcher activeAccount={activeAccount} />
                    <Button tertiary disabled={client?.is_logging_out} onClick={oAuthLogout}>
                        <Localize i18n_default_text='Log out' />
                    </Button>
                </div>
            );
        } else {
            return (
                <div className='auth-actions'>
                    <Button
                        tertiary
                        onClick={() => {
                            const appIdFromGetAppId = getAppId();
                            const { app_id: appIdFromDefault } = getDefaultAppIdAndUrl();

                            console.log('getAppId() returns:', appIdFromGetAppId);
                            console.log('getDefaultAppIdAndUrl() returns:', appIdFromDefault);
                            console.log('localStorage config.app_id:', localStorage.getItem('config.app_id'));
                            console.log('isStaging():', isStaging());
                            console.log('isTestLink():', isTestLink());
                            console.log('Current domain:', getCurrentProductionDomain());

                            // Use the same app_id that will be used for validation
                            const directOAuthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${appIdFromDefault}&l=EN&brand=deriv`;
                            console.log('Direct OAuth URL:', directOAuthUrl);
                            window.location.replace(directOAuthUrl);
                        }}
                    >
                        <Localize i18n_default_text='Log in (Direct Test)' />
                    </Button>
                </div>
            );
        }
    }, [
        isAuthenticating,
        isAuthorizing,
        isSingleLoggingIn,
        isDesktop,
        activeLoginid,
        isAuthorized,
        hasSessionToken,
        standalone_routes,
        client,
        currency,
        localize,
        activeAccount,
        is_virtual,
        oAuthLogout,
    ]);

    if (client?.should_hide_header) return null;

    return (
        <Header
            className={clsx('app-header', {
                'app-header--desktop': isDesktop,
                'app-header--mobile': !isDesktop,
            })}
        >
            <Wrapper variant='left'>
                <AppLogo />
                <MobileMenu />
                {isDesktop && client?.is_logged_in && <MenuItems.TradershubLink />}
                {isDesktop && <MenuItems />}
            </Wrapper>
            <Wrapper variant='right'>{renderAccountSection()}</Wrapper>
        </Header>
    );
});

export default AppHeader;
