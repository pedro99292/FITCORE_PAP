import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Define icon type for type safety
type IconType = 'fontawesome' | 'ionicons' | 'material';

// Sample data for achievements
const achievementsData = [
    { 
        id: 1, 
        title: '5K Run Master', 
        description: 'Completed a 5K run in under 30 minutes', 
        date: '2023-01-15',
        iconType: 'ionicons' as IconType,
        icon: 'fitness',
        progress: 100,
        color: '#FF6B6B'
    },
    { 
        id: 2, 
        title: 'Weight Lifting Pro', 
        description: 'Lifted 100kg in deadlift', 
        date: '2023-03-10',
        iconType: 'material' as IconType,
        icon: 'weight-lifter',
        progress: 100,
        color: '#FFD166'
    },
    { 
        id: 3, 
        title: 'Cardio Warrior', 
        description: 'Complete 50 cardio sessions', 
        date: 'In Progress',
        iconType: 'fontawesome' as IconType,
        icon: 'heartbeat',
        progress: 70,
        color: '#F72585'
    },
    { 
        id: 4, 
        title: 'Protein Tracker', 
        description: 'Track your protein intake for 30 days', 
        date: 'In Progress',
        iconType: 'fontawesome' as IconType,
        icon: 'cutlery',
        progress: 45,
        color: '#06D6A0'
    },
];

// Define prop types for AchievementItem
interface AchievementItemProps {
    title: string;
    description: string;
    date: string;
    icon: string;
    iconType: IconType;
    progress: number;
    color: string;
}

const AchievementItem: React.FC<AchievementItemProps> = ({ title, description, date, icon, iconType, progress, color }) => {
    // Render the appropriate icon based on icon type
    const renderIcon = () => {
        switch (iconType) {
            case 'fontawesome':
                return <FontAwesome name={icon as any} size={24} color="#fff" />;
            case 'ionicons':
                return <Ionicons name={icon as any} size={24} color="#fff" />;
            case 'material':
                return <MaterialCommunityIcons name={icon as any} size={24} color="#fff" />;
            default:
                return <FontAwesome name="star" size={24} color="#fff" />;
        }
    };

    return (
        <View style={styles.achievementItem}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                {renderIcon()}
            </View>
            <View style={styles.achievementContent}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
                    </View>
                    <Text style={styles.date}>{date}</Text>
                </View>
            </View>
        </View>
    );
};

const AchievementsPage = () => {
    // Filter completed and in-progress achievements
    const completedAchievements = achievementsData.filter(achievement => achievement.progress === 100);
    const inProgressAchievements = achievementsData.filter(achievement => achievement.progress < 100);
    
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <Text style={styles.header}>Gym Achievements</Text>
                    <Text style={styles.statsText}>Completed: {completedAchievements.length} | In Progress: {inProgressAchievements.length}</Text>
                </View>
                
                {/* Achievement Categories */}
                <View style={styles.categoriesContainer}>
                    <TouchableOpacity style={[styles.categoryTab, styles.activeTab]}>
                        <Text style={styles.categoryText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.categoryTab}>
                        <Text style={styles.categoryText}>Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.categoryTab}>
                        <Text style={styles.categoryText}>In Progress</Text>
                    </TouchableOpacity>
                </View>
                
                {/* Achievements List */}
                <View style={styles.achievementsList}>
                    {achievementsData.map(achievement => (
                        <AchievementItem 
                            key={achievement.id} 
                            title={achievement.title} 
                            description={achievement.description} 
                            date={achievement.date}
                            icon={achievement.icon}
                            iconType={achievement.iconType as IconType}
                            progress={achievement.progress}
                            color={achievement.color}
                        />
                    ))}
                </View>
                
                {/* Trophy Section */}
                <View style={styles.trophySection}>
                    <View style={styles.sectionHeader}>
                        <FontAwesome name="trophy" size={24} color="#FFD700" />
                        <Text style={styles.sectionTitle}>Your Trophies</Text>
                    </View>
                    <View style={styles.trophyGrid}>
                        {[1, 2, 3].map((item) => (
                            <View key={item} style={styles.trophyItem}>
                                <FontAwesome name="trophy" size={36} color="#FFD700" />
                                <Text style={styles.trophyText}>Level {item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2D2B3F',
    },
    scrollView: {
        width: '100%',
    },
    contentContainer: {
        padding: screenWidth * 0.06,
        paddingTop: screenWidth * 0.08,
    },
    headerSection: {
        marginBottom: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    statsText: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.7,
    },
    categoriesContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    categoryTab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#3e3e50',
    },
    activeTab: {
        backgroundColor: '#5C5B8F',
    },
    categoryText: {
        color: '#fff',
        fontWeight: '500',
    },
    achievementsList: {
        marginBottom: 24,
    },
    achievementItem: {
        backgroundColor: '#3e3e50',
        borderRadius: 12,
        marginBottom: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    achievementContent: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.8,
        marginBottom: 8,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressBackground: {
        flex: 1,
        height: 8,
        backgroundColor: '#22223b',
        borderRadius: 4,
        marginRight: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    date: {
        fontSize: 12,
        color: '#fff',
        opacity: 0.6,
    },
    trophySection: {
        backgroundColor: '#3e3e50',
        borderRadius: 15,
        padding: 16,
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    trophyGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    trophyItem: {
        alignItems: 'center',
        padding: 12,
    },
    trophyText: {
        color: '#fff',
        marginTop: 8,
        fontWeight: '500',
    },
});

export default AchievementsPage;
