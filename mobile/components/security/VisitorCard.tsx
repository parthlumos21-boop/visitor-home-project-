import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LogOut, LogIn } from 'lucide-react-native';
import VisitorProfileHeader from './VisitorProfileHeader';
import VisitorDetailsList from './VisitorDetailsList';

interface VisitorCardProps {
  visit: any;
  now: number;
  isLoadingAction?: boolean;
  onCheckIn?: (visitId: string) => void;
  onCheckOut?: (visitId: string) => void;
}

const formatStoredTime = (dateStr?: string | null) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDuration = (minutes?: number | null) => {
  if (typeof minutes !== 'number') return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

export const VisitorCard: React.FC<VisitorCardProps> = ({
  visit,
  now,
  isLoadingAction = false,
  onCheckIn,
  onCheckOut,
}) => {
  const scheduled = visit.scheduledAt ? new Date(visit.scheduledAt) : new Date();
  const dateStr = scheduled.toLocaleDateString('en-IN');
  const timeStr = scheduled.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const checkInTime = formatStoredTime(visit.checkInAt);
  const checkOutTime = formatStoredTime(visit.checkOutAt);

  const runningDurationMinutes = visit.checkInAt
    ? Math.max(0, Math.floor((now - new Date(visit.checkInAt).getTime()) / 60000))
    : null;

  const durationStr =
    visit.status === 'CHECKED_IN'
      ? `${formatDuration(runningDurationMinutes) || '0 min'} (running)`
      : formatDuration(visit.durationMinutes);

  const outStr =
    visit.status === 'CHECKED_IN'
      ? 'Not checked out'
      : checkOutTime || null;

  const hostStr = visit.host?.name
    ? `${visit.host.name} (${visit.host.department || 'General'})`
    : 'N/A';

  return (
    <View style={styles.cardContainer}>
      {/* 1. Visitor Profile Header (Avatar + ID & Name + Status Badge) */}
      <VisitorProfileHeader
        displayId={visit.displayId}
        name={visit.visitor?.name}
        status={visit.status}
      />

      {/* 2. 7 Information Fields in Exact Sequence */}
      <VisitorDetailsList
        phone={visit.visitor?.phone}
        host={hostStr}
        time={`${dateStr} at ${timeStr}`}
        purpose={visit.purpose}
        inside={checkInTime}
        out={outStr}
        duration={durationStr}
      />

      {/* 3. Action Buttons */}
      {visit.status === 'CHECKED_IN' && onCheckOut && (
        <TouchableOpacity
          disabled={isLoadingAction}
          onPress={() => onCheckOut(visit.id)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Check Out Visitor"
          style={styles.checkoutButton}
        >
          {isLoadingAction ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.buttonContentRow}>
              <LogOut color="#FFFFFF" size={18} strokeWidth={2.4} style={styles.btnIcon} />
              <Text style={styles.buttonText}>CHECK OUT</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {visit.status === 'APPROVED' && !visit.checkInAt && onCheckIn && (
        <TouchableOpacity
          disabled={isLoadingAction}
          onPress={() => onCheckIn(visit.id)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Check In Visitor"
          style={styles.checkinButton}
        >
          {isLoadingAction ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.buttonContentRow}>
              <LogIn color="#FFFFFF" size={18} strokeWidth={2.4} style={styles.btnIcon} />
              <Text style={styles.buttonText}>CHECK IN</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#172033',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(23, 32, 51, 0.05)',
      },
    }),
  },
  checkoutButton: {
    backgroundColor: '#2864DC',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#2864DC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  checkinButton: {
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'OpenSans-Bold',
    letterSpacing: 0.6,
  },
});

export default VisitorCard;
