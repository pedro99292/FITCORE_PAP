import AsyncStorage from '@react-native-async-storage/async-storage';

const SAFETY_WARNINGS_KEY = 'neverShowSafetyWarnings';

export class SafetyPreferences {
  /**
   * Check if safety warnings are disabled
   */
  static async areWarningsDisabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(SAFETY_WARNINGS_KEY);
      return value === 'true';
    } catch (error) {
      console.log('Error reading safety preferences:', error);
      return false; // Default to showing warnings if there's an error
    }
  }

  /**
   * Check if safety warnings are enabled
   */
  static async areWarningsEnabled(): Promise<boolean> {
    return !(await this.areWarningsDisabled());
  }

  /**
   * Disable safety warnings
   */
  static async disableWarnings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SAFETY_WARNINGS_KEY, 'true');
    } catch (error) {
      console.log('Error disabling safety warnings:', error);
      throw error;
    }
  }

  /**
   * Enable safety warnings (remove the disable flag)
   */
  static async enableWarnings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SAFETY_WARNINGS_KEY);
    } catch (error) {
      console.log('Error enabling safety warnings:', error);
      throw error;
    }
  }

  /**
   * Toggle safety warnings on/off
   */
  static async toggleWarnings(): Promise<boolean> {
    const currentlyDisabled = await this.areWarningsDisabled();
    
    if (currentlyDisabled) {
      await this.enableWarnings();
      return true; // Now enabled
    } else {
      await this.disableWarnings();
      return false; // Now disabled
    }
  }

  /**
   * Reset safety preferences to default (warnings enabled)
   */
  static async resetToDefaults(): Promise<void> {
    await this.enableWarnings();
  }

  /**
   * Get a readable status string
   */
  static async getStatusString(): Promise<string> {
    const enabled = await this.areWarningsEnabled();
    return enabled ? 'Enabled' : 'Disabled';
  }
}

export default SafetyPreferences; 