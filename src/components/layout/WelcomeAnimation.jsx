import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const logo = require('../../../assets/ragas-logo.png');

// In-memory flag — resets to false each time the JS process starts fresh.
// Stays true once the animation has run, so backgrounding and foregrounding skips it.
let hasSeenWelcomeThisSession = false;

const WelcomeAnimation = () => {
  const [show, setShow] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;
  const float = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasSeenWelcomeThisSession) {
      hasSeenWelcomeThisSession = true;
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return undefined;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const ringLoop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    floatLoop.start();
    ringLoop.start();

    const hideTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }).start(() => setShow(false));
    }, 2450);

    return () => {
      clearTimeout(hideTimer);
      floatLoop.stop();
      ringLoop.stop();
    };
  }, [float, opacity, ring, scale, show]);

  if (!show) return null;

  const floatY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });
  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1.45],
  });
  const ringOpacity = ring.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.9, 0],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={styles.content}>
        <View style={styles.visualizer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.ring,
                styles[`ring${index + 1}`],
                {
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
          ))}
          <Animated.View style={[styles.logoCard, { transform: [{ scale }, { translateY: floatY }] }]}>
            <Image source={logo} style={styles.logo} />
          </Animated.View>
          <View style={styles.equalizer}>
            {[14, 26, 36, 24, 17].map((height, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.equalizerBar,
                  {
                    height,
                    transform: [{ scaleY: float.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }],
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.note, styles.note1]}>♪</Text>
          <Text style={[styles.note, styles.note2]}>♫</Text>
          <Text style={[styles.note, styles.note3]}>♬</Text>
          <View style={[styles.particle, styles.particle1]} />
          <View style={[styles.particle, styles.particle2]} />
          <View style={[styles.particle, styles.particle3]} />
        </View>
        <Text style={styles.title}>RAGAS</Text>
        <Text style={styles.subtitle}>Enter the rhythm</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: '#030209',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    gap: 34,
  },
  visualizer: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    width: 220,
  },
  ring: {
    borderRadius: 120,
    borderWidth: 1.5,
    position: 'absolute',
  },
  ring1: {
    borderColor: 'rgba(34, 211, 238, 0.48)',
    height: 200,
    width: 200,
  },
  ring2: {
    borderColor: 'rgba(168, 85, 247, 0.48)',
    height: 170,
    width: 170,
  },
  ring3: {
    borderColor: 'rgba(251, 113, 133, 0.44)',
    height: 140,
    width: 140,
  },
  logoCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderColor: 'rgba(248, 250, 252, 0.16)',
    borderRadius: 42,
    borderWidth: 1,
    height: 170,
    justifyContent: 'center',
    padding: 10,
    width: 170,
  },
  logo: {
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    borderRadius: 34,
    height: 145,
    resizeMode: 'contain',
    width: 145,
  },
  equalizer: {
    alignItems: 'flex-end',
    bottom: 5,
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
  },
  equalizerBar: {
    backgroundColor: colors.cyan,
    borderRadius: 999,
    width: 7,
  },
  note: {
    fontFamily: font.black,
    fontSize: 28,
    position: 'absolute',
  },
  note1: {
    color: colors.cyan,
    left: 4,
    top: 74,
  },
  note2: {
    color: colors.accent,
    right: 6,
    top: 56,
  },
  note3: {
    bottom: 42,
    color: colors.pink,
    right: 38,
  },
  particle: {
    borderRadius: 999,
    position: 'absolute',
  },
  particle1: {
    backgroundColor: colors.cyan,
    height: 6,
    left: 20,
    top: 30,
    width: 6,
  },
  particle2: {
    backgroundColor: colors.accent,
    bottom: 40,
    height: 8,
    right: 15,
    width: 8,
  },
  particle3: {
    backgroundColor: colors.danger,
    height: 5,
    right: 50,
    top: 10,
    width: 5,
  },
  title: {
    color: colors.cyan,
    fontFamily: font.black,
    fontSize: 48,
    letterSpacing: 8,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: font.bold,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default WelcomeAnimation;
