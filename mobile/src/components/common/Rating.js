/**
 * Rating Component - Interactive star rating
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { spacing } from '../../theme/typography';

const Rating = ({
  rating = 0,
  maxRating = 5,
  size = 24,
  editable = false,
  onRatingChange,
  color = '#FFB800',
  style,
}) => {
  const handlePress = (value) => {
    if (editable && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isHalf = starValue - 0.5 === rating;

        return (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(starValue)}
            disabled={!editable}
            activeOpacity={0.7}
            style={styles.star}
          >
            <Text style={[styles.starText, { fontSize: size, color }]}>
              {isFilled ? '★' : isHalf ? '⯨' : '☆'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: spacing.xxs,
  },
  starText: {
    fontWeight: 'bold',
  },
});

export default Rating;
