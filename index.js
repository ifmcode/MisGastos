// Custom Expo Router entry. It must run before the router renders: NativeWind
// reads React Native's deprecated `SafeAreaView`/`ImageBackground` getters while
// the first screen is rendering, which happens before `app/_layout.tsx` is
// evaluated. Installing the LogBox ignores in the layout was too late.
import './lib/dev-logbox';
import 'expo-router/entry';
