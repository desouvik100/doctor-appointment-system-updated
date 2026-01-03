/**
 * Family Members Screen - Manage family profiles
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  RefreshControl, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../services/api/apiClient';

const FamilyMembersScreen = ({ navigation }) => {
  const { user } = useUser();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: '', phone: '', dateOfBirth: '' });
  const [adding, setAdding] = useState(false);

  const relations = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];

  const fetchMembers = useCallback(async () => {
    try {
      // Backend route is /family/user/:userId
      const response = await apiClient.get(`/family/user/${user?.id || user?._id}`);
      // Response is array directly, not { members: [] }
      setMembers(Array.isArray(response.data) ? response.data : response.data?.members || []);
    } catch (error) {
      // Silently fail - show empty state
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !newMember.relation) {
      Alert.alert('Error', 'Name and relation are required');
      return;
    }
    setAdding(true);
    try {
      // Backend route is POST /family with primaryUserId in body
      await apiClient.post('/family', {
        ...newMember,
        primaryUserId: user?.id || user?._id,
      });
      Alert.alert('Success', 'Family member added');
      setShowAddModal(false);
      setNewMember({ name: '', relation: '', phone: '', dateOfBirth: '' });
      fetchMembers();
    } catch (error) {
      Alert.alert('Error', 'Failed to add family member');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = (member) => {
    Alert.alert('Remove Member', `Remove ${member.name} from family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          // Backend route is DELETE /family/:id
          await apiClient.delete(`/family/${member._id}`);
          fetchMembers();
        } catch (error) {
          Alert.alert('Error', 'Failed to remove member');
        }
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
          <Icon name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Family Members</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Icon name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        
        {members.length > 0 ? (
          members.map((member, index) => (
            <Card key={member._id || index} variant="default" style={[styles.memberCard, { backgroundColor: colors.surface }]}>
              <Avatar name={member.name} size="medium" />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.name}</Text>
                <Text style={[styles.memberRelation, { color: colors.textSecondary }]}>{member.relation}</Text>
                {member.phone && <Text style={[styles.memberPhone, { color: colors.textMuted }]}>{member.phone}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                <Icon name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Family Members</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>Add family members to book appointments for them</Text>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addBtnText}>Add Family Member</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={newMember.name} onChangeText={(t) => setNewMember({...newMember, name: t})}
              placeholder="Full Name" placeholderTextColor={colors.textMuted} />
            
            <Text style={[styles.label, { color: colors.textSecondary }]}>Relation</Text>
            <View style={styles.relationsRow}>
              {relations.map((rel) => (
                <TouchableOpacity key={rel}
                  style={[styles.relationBtn, { backgroundColor: colors.surface },
                    newMember.relation === rel && { backgroundColor: colors.primary }]}
                  onPress={() => setNewMember({...newMember, relation: rel})}>
                  <Text style={[styles.relationText, { color: colors.textSecondary },
                    newMember.relation === rel && { color: '#fff' }]}>{rel}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
              value={newMember.phone} onChangeText={(t) => setNewMember({...newMember, phone: t})}
              placeholder="Phone (optional)" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddMember} disabled={adding}>
              {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Add Member</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headlineMedium },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md },
  memberInfo: { flex: 1, marginLeft: spacing.md },
  memberName: { ...typography.bodyLarge, fontWeight: '600' },
  memberRelation: { ...typography.bodySmall, marginTop: 2 },
  memberPhone: { ...typography.labelSmall, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.headlineSmall, marginBottom: spacing.sm },
  emptyDesc: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.lg },
  addBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  addBtnText: { ...typography.button, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: borderRadius.xxl, borderTopRightRadius: borderRadius.xxl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalTitle: { ...typography.headlineSmall },
  input: { ...typography.bodyLarge, padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  label: { ...typography.labelMedium, marginBottom: spacing.sm },
  relationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  relationBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  relationText: { ...typography.labelMedium },
  saveBtn: { padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { ...typography.button, color: '#fff' },
});

export default FamilyMembersScreen;
