/**
 * ProgressStepper Component - Multi-step progress indicator
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing } from '../../theme/typography';

const ProgressStepper = ({
  steps = [],
  currentStep = 0,
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted || isActive
                      ? colors.primary
                      : colors.surface,
                    borderColor: isCompleted || isActive
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color: isCompleted || isActive
                        ? '#fff'
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {isCompleted ? '✓' : index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isActive
                      ? colors.textPrimary
                      : colors.textSecondary,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {step}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor: isCompleted
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  stepNumber: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  stepLabel: {
    ...typography.labelSmall,
    textAlign: 'center',
    maxWidth: 80,
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
    marginBottom: 24,
  },
});

export default ProgressStepper;
