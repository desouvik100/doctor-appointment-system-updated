/**
 * UpiAppIcon - Uses local image assets for accurate brand logos
 */

import React from 'react';
import { Image, View } from 'react-native';

const LOGOS = {
  gpay:    require('../../assets/upi/latest-google-pay-icon-logo.jpg'),
  phonepe: require('../../assets/upi/phonepe_logo.png'),
  paytm:   require('../../assets/upi/paytm.jpg'),
  bhim:    require('../../assets/upi/bhim-upi.png'),
  slice:   require('../../assets/upi/slice.png'),
};

const UpiAppIcon = ({ appId, size = 44 }) => {
  const src = LOGOS[appId];
  if (!src) return <View style={{ width: size, height: size }} />;
  return (
    <Image
      source={src}
      style={{ width: size, height: size, borderRadius: 10 }}
      resizeMode="contain"
    />
  );
};

export default UpiAppIcon;
