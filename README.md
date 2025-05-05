# FitCore - Fitness Tracking & Social Workout App

<img src="./assets/images/logo.png" alt="FitCore Logo" width="200" />

FitCore is a comprehensive fitness tracking application built with React Native and Expo. It allows users to track workouts, build custom workout routines, connect with other fitness enthusiasts, and track achievements.

## Features

- **Workout Tracking**: Create, save, and track your workout routines
- **Exercise Library**: Access a comprehensive database of exercises
- **Custom Workout Builder**: Create personalized workout routines
- **Progress Tracking**: Monitor your fitness journey with detailed statistics
- **Social Connectivity**: Follow other users, share achievements, and get inspired
- **Achievement System**: Unlock achievements as you reach fitness milestones
- **Dark/Light Mode**: Choose your preferred theme for the app
- **Profile Customization**: Edit your profile and customize your fitness goals

## Technology Stack

- **Frontend**: React Native with Expo
- **State Management**: React Context API
- **Animations**: React Native Reanimated
- **Navigation**: Expo Router
- **Backend**: Supabase (Authentication, Database, Storage)
- **Styling**: StyleSheet and Linear Gradients

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fitcore.git
   cd fitcore
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   # or
   npx expo start
   ```

4. Open the app in:
   - Expo Go on your physical device
   - iOS Simulator
   - Android Emulator

## Development

### Project Structure

- `app/`: Contains the main application screens and navigation setup
  - `(tabs)/`: Contains tab-based screens (home, profile, social, achievements)
  - `(auth)/`: Authentication-related screens
- `components/`: Reusable UI components
- `contexts/`: React Context providers (Auth, Theme)
- `hooks/`: Custom React hooks
- `supabase/`: Supabase configuration and migrations
- `utils/`: Utility functions
- `types/`: TypeScript type definitions
- `constants/`: Application constants including colors and theme settings
- `assets/`: Images, fonts, and other static assets

### Key Features Implementation

#### Authentication

The app uses Supabase for authentication, supporting:
- Email/password login
- Social login options
- Profile management

#### Workout System - Still in progress

- Create and save custom workouts
- Track workout history and progress
- Filter exercises by muscle groups
- Record sets, reps, and weights


#### Social Features

- Follow other fitness enthusiasts
- Share workouts and achievements
- Engage with the fitness community

## Database Schema

The application uses Supabase as its backend with the following key tables:

- `users`: User profiles and authentication
- `workouts`: Workout templates and history
- `exercises`: Exercise database
- `user_followers`: Social connections between users
- `achievements`: User achievements and milestones

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Supabase](https://supabase.io)
