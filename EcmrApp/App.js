import React from 'react';
import Amplify, {I18n} from 'aws-amplify';
import awsmobile from './aws-exports';
import {Authenticator, ConfirmSignUp, Greetings, SignUp, withAuthenticator} from 'aws-amplify-react-native';
import { createAppContainer} from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack'
import Transports from "./Transports";
import Transport from "./Transport";
import ConfirmLoading from "./ConfirmLoading";
import SignSelection from "./SignSelection";
import Signature from "./Signature";
import CaptureSignature from "./CaptureSignature";
import SettingsScreen from "./SettingsScreen";
import LinkAccount from "./LinkAccount";
import SignatoryInformation from "./SignatoryInformation";
import {createBottomTabNavigator} from "react-navigation-tabs";
import AmplifyTheme from "aws-amplify-react-native/dist/AmplifyTheme";
import EcmrSignIn from "./EcmrSignIn";
import Loading from "aws-amplify-react-native/dist/Auth/Loading";
import ConfirmSignIn from "aws-amplify-react-native/dist/Auth/ConfirmSignIn";
import VerifyContact from "aws-amplify-react-native/dist/Auth/VerifyContact";
import ForgotPassword from "aws-amplify-react-native/dist/Auth/ForgotPassword";
import RequireNewPassword from "aws-amplify-react-native/dist/Auth/RequireNewPassword";
import {Icon} from "react-native-elements";
import AddPhotos from "./AddPhotos";
import i18nDictionaryNl from './i18n/nl/resource';
import { Platform, NativeModules } from 'react-native';


const deviceLanguage =
    Platform.OS === 'ios'
        ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
        : NativeModules.I18nManager.localeIdentifier;

const vocabularies = {
    nl: i18nDictionaryNl
};

I18n.setLanguage(deviceLanguage.split("_")[0]);
I18n.putVocabularies(vocabularies);

Amplify.configure(awsmobile);
Amplify.Logger.LOG_LEVEL = 'DEBUG';

const MainNavigator = createStackNavigator({
    Transports: {screen: Transports},
    Transport: {screen: Transport},
    ConfirmLoading: {screen: ConfirmLoading},
    SignSelection: {screen: SignSelection},
    Signature: {screen: Signature},
    CaptureSignature: {screen: CaptureSignature},
    SignatoryInformation: {screen: SignatoryInformation},
    AddPhotos: {screen: AddPhotos}
});

const SettingsNavigator = createStackNavigator({
    SettingsScreen: {
        screen: withAuthenticator(SettingsScreen),
        navigationOptions: {
            title: "Open e-CMR"
        }
    },
    LinkAccount: {screen: LinkAccount}
});

const TabNavigator = createBottomTabNavigator({
    Home: {
        screen: MainNavigator,
        navigationOptions: {
            tabBarIcon: ({ focused, tintColor }) => {
                return <Icon name={"local-shipping"}/>
            },
            tabBarLabel: I18n.get("Transports")
        }
    },
    Settings: {
        screen: SettingsNavigator,
        navigationOptions: {
            tabBarIcon: ({ focused, tintColor }) => {
                return <Icon name="settings"/>
            },
            tabBarLabel: I18n.get("Settings")
        }
    }
});


const App = createAppContainer(TabNavigator);
const AppWithPersistence = () => <App/>;


const MySectionHeader = Object.assign({}, AmplifyTheme.button, { backgroundColor: 'rgb(60,176,60)' });
const MyTheme = Object.assign({}, AmplifyTheme, {button: MySectionHeader});


export default withAuthenticator(AppWithPersistence,false, [
    <EcmrSignIn override={'SignIn'}/>,
    <Loading />,
    <SignUp />,
    <ConfirmSignIn />,
    <VerifyContact />,
    <ConfirmSignUp />,
    <ForgotPassword />,
    <RequireNewPassword />
], null, MyTheme);