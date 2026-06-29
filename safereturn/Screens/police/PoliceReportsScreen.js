// Screens/police/PoliceReportsScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeReturn } from '../context/SafeReturnContext';

const FILTERS = ['All', 'Missing', 'Sighting', 'Solved', 'Pending'];

export default function PoliceReportsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fetchPoliceReports } = useSafeReturn();
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const filterColumns = width >= 720 ? 4 : width >= 520 ? 3 : 2;
  const filterGap = 10;
  const filterTileWidth = useMemo(() => {
    const horizontalPadding = 32;
    const availableWidth = Math.max(width - horizontalPadding, 0);
    return Math.max(
      0,
      Math.floor((availableWidth - filterGap * (filterColumns - 1)) / filterColumns)
    );
  }, [filterColumns, width]);
  const [reports, setReports] = useState([]);
  const initialFilter = route?.params?.initialFilter || 'All';
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const data = await fetchPoliceReports?.(0, 100);
      const reportsList = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
          ? data
          : [];
      setReports(reportsList);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPoliceReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setSelectedFilter(initialFilter);
  }, [initialFilter]);

  const reportCounts = useMemo(() => {
    const counts = {
      all: reports.length,
      missing: 0,
      sighting: 0,
      solved: 0,
      pending: 0,
    };

    reports.forEach((report) => {
      const status = (report.status || '').toLowerCase();
      const type = (report.reportType || '').toLowerCase();
      const isSighting = type === 'sighting' || status === 'sighting';
      const isSolved = status === 'resolved' || status === 'solved' || status === 'found';

      if (isSighting) counts.sighting += 1;
      else if (isSolved) counts.solved += 1;
      else counts.missing += 1;

      if (status === 'pending_verification' || status === 'under_review' || status === 'published') {
        counts.pending += 1;
      }
    });

    return counts;
  }, [reports]);

  const visibleReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reports.filter((report) => {
      const status = (report.status || '').toLowerCase();
      const type = (report.reportType || '').toLowerCase();
      const isSighting = type === 'sighting' || status === 'sighting';
      const isSolved = status === 'resolved' || status === 'solved' || status === 'found';
      const name = (report.fullName || report.name || report.userFullName || '').toLowerCase();
      const place = (
        report.location ||
        report.city ||
        report.state ||
        report.lastSeenPlace ||
        report.address ||
        ''
      ).toLowerCase();
      const caseId = String(report.caseNumber || report.reportId || report.id || '').toLowerCase();

      const matchesFilter =
        selectedFilter === 'All'
          ? true
          : selectedFilter === 'Missing'
            ? !isSighting && !isSolved
            : selectedFilter === 'Sighting'
              ? isSighting
              : selectedFilter === 'Solved'
                ? isSolved
                : selectedFilter === 'Pending'
                  ? status === 'pending_verification' ||
                    status === 'under_review' ||
                    status === 'published'
                  : true;

      const matchesSearch =
        !query ||
        name.includes(query) ||
        place.includes(query) ||
        caseId.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [reports, searchQuery, selectedFilter]);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'resolved' || statusLower === 'solved' || statusLower === 'found')
      return '#22C55E';
    if (statusLower === 'pending_verification' || statusLower === 'under_review')
      return '#FACC15';
    if (statusLower === 'sighting') return '#3B82F6';
    return '#FF4058';
  };

  const getStatusIcon = (report) => {
    const status = report.status?.toLowerCase() || '';
    const type = report.reportType?.toLowerCase() || '';

    if (type === 'sighting' || status === 'sighting') {
      return 'eye-outline';
    } else if (status === 'resolved' || status === 'solved' || status === 'found') {
      return 'checkmark-circle-outline';
    } else if (status === 'pending_verification' || status === 'under_review') {
      return 'time-outline';
    }
    return 'person-outline';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCaseId = (report) => {
    return report.caseNumber || report.reportId || `TS${report.id}`;
  };

  const getPersonName = (report) => {
    return report.fullName || report.name || report.userFullName || 'Unknown person';
  };

  const getPrimaryLocation = (report) => {
    return (
      report.location ||
      report.city ||
      report.state ||
      report.lastSeenPlace ||
      report.address ||
      'Location not provided'
    );
  };

  const getPrimaryImage = (report) => {
    const raw = report.photoUrl || report.image || report.imageUri || '';
    if (!raw) return null;
    return raw.split(',')[0].trim();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.canGoBack?.() ? navigation.goBack() : navigation.navigate('PoliceDashboard')
          }
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="shield-checkmark" size={28} color="#3B82F6" />
          <Text style={styles.headerTitle}>All Reports</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8FAFD4" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isCompact && styles.searchInputSmall]}
          placeholder="Search reports by type, location, or case ID..."
          placeholderTextColor="#8FAFD4"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="funnel-outline" size={22} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryRow, isCompact && styles.summaryRowCompact]}>
        <SummaryPill label="All" value={reportCounts.all} color="#2F8CFF" />
        <SummaryPill label="Missing" value={reportCounts.missing} color="#FF4058" />
        <SummaryPill label="Sightings" value={reportCounts.sighting} color="#3B82F6" />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterGrid}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { width: filterTileWidth },
              filterColumns > 2 && styles.filterTabWide,
              isCompact && styles.filterTabCompact,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            {filter === 'Missing' && (
              <Ionicons
                name="person-outline"
                size={16}
                color={selectedFilter === filter ? '#FFFFFF' : '#FF4058'}
                style={styles.filterIcon}
              />
            )}
            {filter === 'Sighting' && (
              <Ionicons
                name="eye-outline"
                size={16}
                color={selectedFilter === filter ? '#FFFFFF' : '#3B82F6'}
                style={styles.filterIcon}
              />
            )}
            {filter === 'Solved' && (
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={selectedFilter === filter ? '#FFFFFF' : '#22C55E'}
                style={styles.filterIcon}
              />
            )}
            {filter === 'Pending' && (
              <Ionicons
                name="time-outline"
                size={16}
                color={selectedFilter === filter ? '#FFFFFF' : '#FACC15'}
                style={styles.filterIcon}
              />
            )}
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
              numberOfLines={1}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.reportsList}
        contentContainerStyle={styles.reportsListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {visibleReports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#8FAFD4" />
            <Text style={styles.emptyText}>
              {reports.length === 0 ? 'No reports available yet' : 'No reports match your filters'}
            </Text>
            <Text style={styles.emptySubtext}>
              {reports.length === 0
                ? 'Once reports are published in the backend, they will appear here automatically.'
                : 'Try a different filter or search term.'}
            </Text>
          </View>
        ) : (
          visibleReports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportCard, isCompact && styles.reportCardCompact]}
              onPress={() =>
                Alert.alert(
                  'Report Details',
                  'The detailed report view is not wired yet. Use the filters and list view for now.'
                )
              }
            >
              {getPrimaryImage(report) ? (
                <Image
                  source={{ uri: getPrimaryImage(report) }}
                  style={styles.reportImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.reportIconContainer}>
                  <Ionicons
                    name={getStatusIcon(report)}
                    size={32}
                    color={getStatusColor(report.status)}
                  />
                </View>
              )}

              <View style={styles.reportContent}>
                <View style={styles.reportHeader}>
                  <Text numberOfLines={2} style={styles.reportTitle}>{getPersonName(report)}</Text>
                  <Text style={styles.caseId}>Case ID: {getCaseId(report)}</Text>
                </View>

                <View style={styles.reportRow}>
                  <Ionicons name="location-outline" size={16} color="#8FAFD4" />
                  <Text numberOfLines={2} style={styles.locationText}>
                    {getPrimaryLocation(report)}
                  </Text>
                </View>

                <View style={styles.reportRow}>
                  <Ionicons name="calendar-outline" size={16} color="#8FAFD4" />
                  <Text numberOfLines={1} style={styles.dateTimeText}>
                    {formatDate(report.createdAt)} • {formatTime(report.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.reportRight}>
                <View
                  style={[
                    styles.statusBadge,
                    { borderColor: getStatusColor(report.status) },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(report.status) },
                    ]}
                  >
                    {report.status === 'pending_verification'
                      ? 'Pending'
                      : report.status === 'under_review'
                      ? 'Pending'
                      : report.status?.charAt(0).toUpperCase() +
                        report.status?.slice(1)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8FAFD4" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <View style={[styles.summaryPill, { borderColor: `${color}55` }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03102B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#03102B',
  },
  loadingText: {
    color: '#8FAFD4',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#03102B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4058',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#03102B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(143,175,212,0.3)',
  },
  searchIcon: {
    marginRight: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  summaryPill: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  summaryLabel: {
    color: '#AFC4E8',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryRowCompact: {
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  searchInputSmall: {
    fontSize: 13,
  },
  filterButton: {
    padding: 6,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(143,175,212,0.3)',
    gap: 6,
  },
  filterTabWide: {
    flexGrow: 1,
  },
  filterTabCompact: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterTabActive: {
    backgroundColor: '#1460EE',
    borderColor: '#3B82F6',
  },
  filterIcon: {
    marginTop: 1,
  },
  filterText: {
    color: '#8FAFD4',
    fontSize: 13,
    fontWeight: '900',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  reportsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reportsListContent: {
    paddingBottom: 132,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(143,175,212,0.25)',
    alignItems: 'center',
  },
  reportCardCompact: {
    padding: 12,
  },
  reportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(143,175,212,0.3)',
  },
  reportContent: {
    flex: 1,
    minWidth: 0,
  },
  reportImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(143,175,212,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  reportHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  reportTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    flex: 1,
    marginRight: 8,
  },
  caseId: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  locationText: {
    color: '#8FAFD4',
    fontSize: 13,
    fontWeight: '600',
  },
  dateTimeText: {
    color: '#8FAFD4',
    fontSize: 12,
    fontWeight: '600',
  },
  reportRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#8FAFD4',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#8FAFD4',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
