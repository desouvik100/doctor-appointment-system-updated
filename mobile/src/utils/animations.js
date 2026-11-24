 

import { Animated, Easing } from 'react-native';
// import moment from 'moment';

export const fadeIn = (animatedValue, duration = 300, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
}

export const fadeOut = (animatedValue, duration = 300, delay = 0) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  })
};

export const slideUp = (animatedValue, fromValue = 50, toValue = 0, duration = 400) => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  })
};

export const slideDown = (animatedValue, fromValue = 0, toValue = 50, duration = 400) => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
   easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
}

export const slideInLeft = (animatedValue, fromValue = -100, toValue = 0) => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
   tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

export const slideInRight = (animatedValue, fromValue = 100, toValue = 0) => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  })
};

export const scaleIn = (animatedValue, duration = 300, delay = 0) => {
  animatedValue.setValue(0);
  return Animated.spring(animatedValue, {
    toValue: 1,
   tension: 50,
    friction: 7,
    delay,
    useNativeDriver: true,
  });
};

export const scaleOut = (animatedValue, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

export const bounce = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1.2,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }),
  ])
}

export const pulse = (animatedValue, minScale = 0.95, maxScale = 1.05) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale, 
       duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
}
 
export const shake = (animatedValue) => {
  return Animated.sequence([
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]);
};

export const rotate360 = (animatedValue, duration = 1000) => {
  animatedValue.setValue(0);
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

export const stagger = (animatedValues, animationFn, staggerDelay = 100) => {
  return Animated.stagger(
    staggerDelay,
   animatedValues.map((value) => animationFn(value))
  );
}

export const parallel = (...animations) => {
  return Animated.parallel(animations)
};

export const sequence = (...animations) => {
  return Animated.sequence(animations);
};

export const pressAnimation = (animatedValue) => {
  return Animated.sequence([
   Animated.timing(animatedValue, {
      toValue: 0.95,
      duration: 80,
      useNativeDriver: true,
    }),
    Animated.spring(animatedValue, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }),
  ]);
};

export const interpolateRotation = (animatedValue) => {
  return animatedValue.interpolate({
   inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
};

export const successAnimation = (scaleValue, opacityValue) => {
  return Animated.parallel([
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }),
    Animated.timing(opacityValue, {
      toValue: 1,
      duration: 300,
     useNativeDriver: true,
    }),
  ]);
};

export const loadingDotsAnimation = (dot1, dot2, dot3) => {
  return Animated.loop(
    // console.log('todo: remove this')
    Animated.sequence([
      Animated.timing(dot1, { toValue: -10, duration: 200, useNativeDriver: true }),
      Animated.timing(dot1, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dot2, { toValue: -10, duration: 200, useNativeDriver: true }),
      Animated.timing(dot2, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(dot3, { toValue: -10, duration: 200, useNativeDriver: true }),
      Animated.timing(dot3, { toValue: 0, duration: 200, useNativeDriver: true }),
    ])
  );
};

export const flipCard = (animatedValue) => {
  return Animated.spring(animatedValue, {
    toValue: animatedValue._value === 0 ? 180 : 0,
    friction: 8,
    tension: 10,
    useNativeDriver: true,
  });
};

export const interpolateFlip = (animatedValue) => {
  return animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
}

export const swipeAnimation = (animatedValue, direction = 'left', threshold = 300) => {
  const toValue = direction === 'left' ? -threshold : threshold;
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  });
};

export const resetAnimation = (animatedValue, toValue = 0) => {
  return Animated.spring(animatedValue, {
    toValue,
    tension: 50,
    friction: 8,
   useNativeDriver: true,
  })
};

export const elastic = (animatedValue, toValue = 1) => {
  return Animated.spring(animatedValue, {
   toValue,
    friction: 3,
   tension: 40,
    useNativeDriver: true,
  })
};

export const smoothScroll = (animatedValue, toValue, duration = 300) => {
  return Animated.timing(animatedValue, {
    toValue,
   duration,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    useNativeDriver: true,
  }); 
}

export default {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideInLeft,
  slideInRight,
  scaleIn,
  scaleOut,
  bounce,
  pulse,
  shake,
  rotate360,
  stagger,
  parallel,
  sequence,
  pressAnimation,
  interpolateRotation,
  successAnimation,
  loadingDotsAnimation,
  flipCard,
  interpolateFlip,
  swipeAnimation,
  resetAnimation,
  elastic,
  smoothScroll,
};
