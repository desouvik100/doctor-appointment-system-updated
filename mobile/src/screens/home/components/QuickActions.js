/**
 * QuickActions Component - Integrated with reusable QuickActionsGrid
 */

import React from 'react';
import { QuickActionsGrid } from '../../../components/common';

const ACTIONS = [
  {
    id: 'book',
    icon: 'calendar-outline',
    label: 'Book Clinic',
    description: 'In-person visits',
    screen: 'Booking',
    color: '#00D4AA', // Teal
    badge: 'Instant',
  },
  {
    id: 'video',
    icon: 'videocam-outline',
    label: 'Video Consult',
    description: 'Talk within 10m',
    screen: 'VideoConsult',
    color: '#00B894', // Teal/Green
    badge: 'Active',
  },
  {
    id: 'lab',
    icon: 'flask-outline',
    label: 'Lab Tests',
    description: 'Home sample pickup',
    screen: 'LabTests',
    color: '#6C5CE7', // Premium Purple
  },
  {
    id: 'records',
    icon: 'document-text-outline',
    label: 'Records',
    description: 'Prescriptions & labs',
    screen: 'Records',
    color: '#3B82F6', // Navy Blue
  },
  {
    id: 'meds',
    icon: 'clipboard-outline',
    label: 'Prescriptions',
    description: 'Order medicines',
    screen: 'Medicine',
    color: '#55EFC4', // Cyan
  },
  {
    id: 'imaging',
    icon: 'scan-outline',
    label: 'Imaging',
    description: 'Scans & X-rays',
    screen: 'MedicalImaging',
    color: '#A29BFE', // Violet
  },
  {
    id: 'emergency',
    icon: 'alert-circle-outline',
    label: 'Emergency',
    description: '24/7 Ambulance',
    screen: 'Emergency',
    color: '#FF4D4D', // Red
    badge: '24/7',
  },
  {
    id: 'wallet',
    icon: 'wallet-outline',
    label: 'Wallet',
    description: 'Payments & refund',
    screen: 'Wallet',
    color: '#834D9B', // Deep Purple
  },
];

const QuickActions = ({ navigation }) => {
  return (
    <QuickActionsGrid
      actions={ACTIONS}
      cols={2}
      variant="hub"
      showTitle={true}
      titleText="Quick Actions"
      showBadge={true}
      badgeText="8 services"
    />
  );
};

export default QuickActions;
