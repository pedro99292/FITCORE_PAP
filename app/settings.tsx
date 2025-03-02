import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Dimensions } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  const handleBackToProfile = () => {
    router.replace('/(tabs)/profile');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    hasSwitch, 
    switchValue, 
    onSwitchChange,
    onPress 
  }: {
    icon: keyof typeof FontAwesome.glyphMap;
    title: string;
    subtitle?: string;
    hasSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.background }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
        <FontAwesome name={icon} size={24} color={colors.text} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.background, true: colors.primary }}
          thumbColor={switchValue ? '#fff' : '#f4f3f4'}
        />
      )}
      {!hasSwitch && (
        <FontAwesome name="chevron-right" size={20} color="#8e8e93" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Definições',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={handleBackToProfile}
              style={{ marginLeft: 16 }}
            >
              <FontAwesome name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
              Definições
            </Text>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Conta</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <SettingItem
              icon="user"
              title="Perfil"
              subtitle="Editar informações pessoais"
              onPress={() => router.push('/edit-profile')}
            />
            <SettingItem
              icon="lock"
              title="Privacidade"
              subtitle="Gerenciar configurações de privacidade"
              onPress={() => {}}
            />
            <SettingItem
              icon="bell"
              title="Notificações"
              hasSwitch
              switchValue={notifications}
              onSwitchChange={setNotifications}
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Aplicativo</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <SettingItem
              icon="moon-o"
              title="Modo Escuro"
              hasSwitch
              switchValue={isDarkMode}
              onSwitchChange={toggleTheme}
            />
            <SettingItem
              icon="volume-up"
              title="Sons"
              hasSwitch
              switchValue={soundEffects}
              onSwitchChange={setSoundEffects}
            />
            <SettingItem
              icon="language"
              title="Idioma"
              subtitle="Português"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Suporte</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface, borderColor: colors.background }]}>
            <SettingItem
              icon="question-circle"
              title="Ajuda"
              subtitle="FAQs e guias"
              onPress={() => {}}
            />
            <SettingItem
              icon="envelope"
              title="Contato"
              subtitle="Fale conosco"
              onPress={() => {}}
            />
            <SettingItem
              icon="info-circle"
              title="Sobre"
              subtitle="Versão 1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 2,
  },
  backButton: {
    margin: 16,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  backButtonIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 