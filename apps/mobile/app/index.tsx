// Routes stay paper-thin. The actual screen lives under src/screens so it can
// be rendered in tests without importing Expo Router's runtime.
import WelcomeScreen from '../src/screens/WelcomeScreen';

export default WelcomeScreen;
